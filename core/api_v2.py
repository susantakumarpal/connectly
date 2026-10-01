import json
from functools import wraps

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.db.models import Count, Exists, OuterRef, Q
from django.http import HttpResponse, JsonResponse
from django.middleware.csrf import get_token
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_http_methods

from .forms import CommentForm, PostForm, ProfileForm, RegisterForm
from .models import Post, Profile


def api_login_required(view):
    @wraps(view)
    def wrapped(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return JsonResponse({"detail": "Authentication required."}, status=401)
        return view(request, *args, **kwargs)

    return wrapped


def _json_body(request):
    if request.content_type != "application/json":
        return None, JsonResponse({"detail": "Content-Type must be application/json."}, status=415)
    try:
        payload = json.loads(request.body or b"{}")
    except (UnicodeDecodeError, json.JSONDecodeError):
        return None, JsonResponse({"detail": "Request body must contain valid JSON."}, status=400)
    if not isinstance(payload, dict):
        return None, JsonResponse({"detail": "JSON body must be an object."}, status=400)
    return payload, None


def _user_data(user, request):
    profile = user.profile
    return {
        "id": user.pk,
        "username": user.username,
        "email": user.email,
        "bio": profile.bio,
        "avatar": request.build_absolute_uri(profile.avatar.url) if profile.avatar else None,
        "posts_count": user.posts.count(),
        "followers_count": profile.followers.count(),
        "following_count": profile.following.count(),
    }


def _profile_data(user, request):
    data = _user_data(user, request)
    data.pop("email")
    data["is_following"] = (
        request.user.is_authenticated
        and request.user != user
        and request.user.profile.following.filter(pk=user.profile.pk).exists()
    )
    data["is_self"] = request.user.is_authenticated and request.user.pk == user.pk
    return data


def _with_counts(queryset, user):
    return queryset.annotate(
        likes_count=Count("likes", distinct=True),
        comments_count=Count("comments", distinct=True),
        liked_by_user=Exists(
            Post.likes.through.objects.filter(post_id=OuterRef("pk"), user_id=user.pk)
        ),
    )


def _post_data(post, request):
    profile = post.author.profile
    return {
        "id": post.pk,
        "author": {
            "username": post.author.username,
            "avatar": request.build_absolute_uri(profile.avatar.url) if profile.avatar else None,
        },
        "content": post.content,
        "image": request.build_absolute_uri(post.image.url) if post.image else None,
        "created_at": post.created_at.isoformat(),
        "likes_count": post.likes_count,
        "comments_count": post.comments_count,
        "liked_by_user": post.liked_by_user,
    }


def _post_form(request):
    if request.content_type == "application/json":
        payload, error = _json_body(request)
        if error:
            return None, error
        if not isinstance(payload.get("content", ""), str):
            return None, JsonResponse({"detail": "content must be a string."}, status=400)
        return PostForm(payload), None
    if (request.content_type or "").startswith("multipart/form-data"):
        return PostForm(request.POST, request.FILES), None
    return None, JsonResponse({"detail": "Use application/json or multipart/form-data."}, status=415)


def _comment_data(comment):
    return {
        "id": comment.pk,
        "author": comment.author.username,
        "text": comment.text,
        "created_at": comment.created_at.isoformat(),
    }


@ensure_csrf_cookie
@require_GET
def csrf_token(request):
    return JsonResponse({"csrfToken": get_token(request)})


@require_GET
def current_user(request):
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "Authentication required."}, status=401)
    return JsonResponse({"user": _user_data(request.user, request)})


@require_http_methods(["POST"])
def login_user(request):
    payload, error = _json_body(request)
    if error:
        return error
    username = payload.get("username", "")
    password = payload.get("password", "")
    if not isinstance(username, str) or not isinstance(password, str):
        return JsonResponse({"detail": "Username and password are required."}, status=400)
    user = authenticate(request, username=username.strip(), password=password)
    if user is None:
        return JsonResponse({"detail": "Incorrect username or password."}, status=400)
    login(request, user)
    return JsonResponse({"user": _user_data(user, request)})


@require_http_methods(["POST"])
def register_user(request):
    payload, error = _json_body(request)
    if error:
        return error
    form = RegisterForm(payload)
    if not form.is_valid():
        return JsonResponse({"errors": form.errors.get_json_data()}, status=400)
    user = form.save()
    login(request, user)
    return JsonResponse({"user": _user_data(user, request)}, status=201)


@api_login_required
@require_http_methods(["POST"])
def logout_user(request):
    logout(request)
    return HttpResponse(status=204)


@api_login_required
@require_http_methods(["POST"])
def update_profile(request):
    form = ProfileForm(request.POST, request.FILES, instance=request.user.profile)
    if not form.is_valid():
        return JsonResponse({"errors": form.errors.get_json_data()}, status=400)
    form.save()
    return JsonResponse({"user": _user_data(request.user, request)})


@api_login_required
@require_http_methods(["GET"])
def profile_detail(request, username):
    user = get_object_or_404(User.objects.select_related("profile"), username=username)
    return JsonResponse({"user": _profile_data(user, request)})


@api_login_required
@require_http_methods(["POST", "DELETE"])
def toggle_follow(request, username):
    target = get_object_or_404(Profile.objects.select_related("user"), user__username=username)
    if target.user_id == request.user.pk:
        return JsonResponse({"detail": "You cannot follow yourself."}, status=400)
    following = request.user.profile.following
    if request.method == "POST":
        following.add(target)
        is_following = True
    else:
        following.remove(target)
        is_following = False
    return JsonResponse({"is_following": is_following, "followers_count": target.followers.count()})


@api_login_required
@require_http_methods(["GET", "POST"])
def posts_collection(request):
    if request.method == "POST":
        form, error = _post_form(request)
        if error:
            return error
        if not form.is_valid():
            return JsonResponse({"errors": form.errors.get_json_data()}, status=400)
        post = form.save(commit=False)
        post.author = request.user
        post.save()
        post.likes_count = 0
        post.comments_count = 0
        post.liked_by_user = False
        return JsonResponse(_post_data(post, request), status=201)

    try:
        limit = min(max(int(request.GET.get("limit", 20)), 1), 50)
        offset = max(int(request.GET.get("offset", 0)), 0)
    except ValueError:
        return JsonResponse({"detail": "limit and offset must be integers."}, status=400)
    posts = Post.objects.select_related("author__profile").order_by("-created_at", "-pk")
    if request.GET.get("scope") == "feed":
        following_ids = request.user.profile.following.values_list("user_id", flat=True)
        posts = posts.filter(Q(author=request.user) | Q(author_id__in=following_ids))
    username = request.GET.get("username", "").strip()
    if username:
        posts = posts.filter(author__username=username)
    query = request.GET.get("q", "").strip()
    if query:
        posts = posts.filter(content__icontains=query)
    posts = _with_counts(posts, request.user)
    total = posts.count()
    results = [_post_data(post, request) for post in posts[offset:offset + limit]]
    next_offset = offset + limit if offset + limit < total else None
    return JsonResponse({"count": total, "next_offset": next_offset, "results": results})


@api_login_required
@require_http_methods(["GET", "DELETE"])
def post_detail(request, pk):
    post = get_object_or_404(
        _with_counts(Post.objects.select_related("author__profile"), request.user), pk=pk
    )
    if request.method == "DELETE":
        if post.author_id != request.user.pk:
            return JsonResponse({"detail": "You can only delete your own posts."}, status=403)
        post.delete()
        return HttpResponse(status=204)
    return JsonResponse(_post_data(post, request))


@api_login_required
@require_http_methods(["POST"])
def toggle_like(request, pk):
    post = get_object_or_404(Post, pk=pk)
    if post.likes.filter(pk=request.user.pk).exists():
        post.likes.remove(request.user)
        liked = False
    else:
        post.likes.add(request.user)
        liked = True
    return JsonResponse({"liked": liked, "likes_count": post.likes.count()})


@api_login_required
@require_http_methods(["GET", "POST"])
def post_comments(request, pk):
    post = get_object_or_404(Post, pk=pk)
    if request.method == "POST":
        payload, error = _json_body(request)
        if error:
            return error
        form = CommentForm(payload)
        if not form.is_valid():
            return JsonResponse({"errors": form.errors.get_json_data()}, status=400)
        comment = form.save(commit=False)
        comment.post = post
        comment.author = request.user
        comment.save()
        return JsonResponse(_comment_data(comment), status=201)
    comments = post.comments.select_related("author").all()
    return JsonResponse({"results": [_comment_data(comment) for comment in comments]})


@api_login_required
@require_GET
def search(request):
    query = request.GET.get("q", "").strip()
    if not query:
        return JsonResponse({"users": [], "posts": []})
    users = User.objects.filter(username__icontains=query).select_related("profile")[:12]
    posts = _with_counts(
        Post.objects.filter(content__icontains=query).select_related("author__profile"), request.user
    )[:12]
    return JsonResponse({
        "users": [_profile_data(user, request) for user in users],
        "posts": [_post_data(post, request) for post in posts],
    })