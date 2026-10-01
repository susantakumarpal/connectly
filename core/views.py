from django.contrib import messages
from django.contrib.auth import login
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.core.paginator import Paginator
from django.db.models import Q
from django.http import HttpResponseForbidden
from django.shortcuts import get_object_or_404, redirect, render
from django.views.decorators.http import require_POST

from .forms import CommentForm, PostForm, ProfileForm, RegisterForm
from .models import Post


def _paginate(request, queryset, per_page=10):
    return Paginator(queryset, per_page).get_page(request.GET.get("page"))


def register(request):
    if request.user.is_authenticated:
        return redirect("feed")
    form = RegisterForm(request.POST or None)
    if request.method == "POST" and form.is_valid():
        user = form.save()
        login(request, user)
        messages.success(request, "Welcome aboard!")
        return redirect("feed")
    return render(request, "registration/register.html", {"form": form})


@login_required
def feed(request):
    form = PostForm(request.POST or None, request.FILES or None)
    if request.method == "POST" and form.is_valid():
        post = form.save(commit=False)
        post.author = request.user
        post.save()
        messages.success(request, "Post published.")
        return redirect("feed")

    following_ids = request.user.profile.following.values_list("user_id", flat=True)
    posts = (
        Post.objects.filter(Q(author=request.user) | Q(author_id__in=following_ids))
        .select_related("author__profile")
        .prefetch_related("likes", "comments")
    )
    return render(request, "feed.html", {"form": form, "page": _paginate(request, posts)})


@login_required
def explore(request):
    posts = Post.objects.select_related("author__profile").prefetch_related("likes", "comments")
    return render(request, "explore.html", {"page": _paginate(request, posts)})


@login_required
def search(request):
    q = request.GET.get("q", "").strip()
    users = User.objects.none()
    posts = Post.objects.none()
    if q:
        users = User.objects.filter(username__icontains=q).select_related("profile")[:20]
        posts = Post.objects.filter(content__icontains=q).select_related("author__profile")[:20]
    return render(request, "search.html", {"q": q, "users": users, "posts": posts})


@login_required
def profile(request, username):
    user_obj = get_object_or_404(User.objects.select_related("profile"), username=username)
    posts = user_obj.posts.prefetch_related("likes", "comments")
    is_following = request.user.profile.following.filter(pk=user_obj.profile.pk).exists()
    return render(
        request,
        "profile.html",
        {
            "profile_user": user_obj,
            "page": _paginate(request, posts),
            "is_following": is_following,
            "followers_count": user_obj.profile.followers.count(),
            "following_count": user_obj.profile.following.count(),
        },
    )


@login_required
def edit_profile(request):
    form = ProfileForm(request.POST or None, request.FILES or None, instance=request.user.profile)
    if request.method == "POST" and form.is_valid():
        form.save()
        messages.success(request, "Profile updated.")
        return redirect("profile", username=request.user.username)
    return render(request, "edit_profile.html", {"form": form})


@login_required
def post_detail(request, pk):
    post = get_object_or_404(Post.objects.select_related("author__profile"), pk=pk)
    form = CommentForm(request.POST or None)
    if request.method == "POST" and form.is_valid():
        comment = form.save(commit=False)
        comment.post = post
        comment.author = request.user
        comment.save()
        return redirect("post_detail", pk=post.pk)
    return render(request, "post_detail.html", {"post": post, "form": form})


@login_required
@require_POST
def toggle_like(request, pk):
    post = get_object_or_404(Post, pk=pk)
    if post.likes.filter(pk=request.user.pk).exists():
        post.likes.remove(request.user)
    else:
        post.likes.add(request.user)
    next_url = request.POST.get("next")
    if next_url and next_url.startswith("/") and not next_url.startswith("//"):
        return redirect(next_url)
    return redirect("post_detail", pk=pk)


@login_required
@require_POST
def delete_post(request, pk):
    post = get_object_or_404(Post, pk=pk)
    if post.author != request.user:
        return HttpResponseForbidden("You can only delete your own posts.")
    post.delete()
    messages.info(request, "Post deleted.")
    return redirect("feed")


@login_required
@require_POST
def toggle_follow(request, username):
    target = get_object_or_404(User, username=username)
    if target == request.user:
        messages.warning(request, "You can't follow yourself.")
        return redirect("profile", username=username)
    me = request.user.profile
    if me.following.filter(pk=target.profile.pk).exists():
        me.following.remove(target.profile)
    else:
        me.following.add(target.profile)
    return redirect("profile", username=username)
