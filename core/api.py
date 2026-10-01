import json
from functools import wraps

from django.db.models import Count, Exists, OuterRef
from django.http import HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_http_methods

from .forms import PostForm
from .models import Post


def api_login_required(view):
    @wraps(view)
    def wrapped(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return JsonResponse({"detail": "Authentication required."}, status=401)
        return view(request, *args, **kwargs)

    return wrapped


def _post_data(post, request):
    return {
        "id": post.pk,
        "author": {"username": post.author.username},
        "content": post.content,
        "image": request.build_absolute_uri(post.image.url) if post.image else None,
        "created_at": post.created_at.isoformat(),
        "likes_count": post.likes_count,
        "comments_count": post.comments_count,
        "liked_by_user": post.liked_by_user,
    }


def _with_counts(queryset, user):
    return queryset.annotate(
        likes_count=Count("likes", distinct=True),
        comments_count=Count("comments", distinct=True),
        liked_by_user=Exists(
            Post.likes.through.objects.filter(post_id=OuterRef("pk"), user_id=user.pk)
        ),
    )


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


@api_login_required
@require_http_methods(["GET", "POST"])
def posts_collection(request):
    if request.method == "GET":
        try:
            limit = min(max(int(request.GET.get("limit", 20)), 1), 50)
            offset = max(int(request.GET.get("offset", 0)), 0)
        except ValueError:
            return JsonResponse({"detail": "limit and offset must be integers."}, status=400)
        posts = _with_counts(
            Post.objects.select_related("author").order_by("-created_at", "-pk"), request.user
        )
        total = posts.count()
        results = [_post_data(post, request) for post in posts[offset:offset + limit]]
        next_offset = offset + limit if offset + limit < total else None
        return JsonResponse({"count": total, "next_offset": next_offset, "results": results})

    payload, error = _json_body(request)
    if error:
        return error
    if not isinstance(payload.get("content", ""), str):
        return JsonResponse({"detail": "content must be a string."}, status=400)
    form = PostForm({"content": payload.get("content", "")})
    if not form.is_valid():
        return JsonResponse({"errors": form.errors.get_json_data()}, status=400)
    post = form.save(commit=False)
    post.author = request.user
    post.save()
    post.likes_count = 0
    post.comments_count = 0
    post.liked_by_user = False
    return JsonResponse(_post_data(post, request), status=201)


@api_login_required
@require_http_methods(["GET", "DELETE"])
def post_detail(request, pk):
    post = get_object_or_404(_with_counts(Post.objects.select_related("author"), request.user), pk=pk)
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