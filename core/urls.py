from django.urls import path

from . import api
from . import views

urlpatterns = [
    path("", views.feed, name="feed"),
    path("register/", views.register, name="register"),
    path("explore/", views.explore, name="explore"),
    path("search/", views.search, name="search"),
    path("settings/profile/", views.edit_profile, name="edit_profile"),
    path("post/<int:pk>/", views.post_detail, name="post_detail"),
    path("post/<int:pk>/like/", views.toggle_like, name="toggle_like"),
    path("post/<int:pk>/delete/", views.delete_post, name="delete_post"),
    path("u/<str:username>/", views.profile, name="profile"),
    path("u/<str:username>/follow/", views.toggle_follow, name="toggle_follow"),
    path("api/v1/posts/", api.posts_collection, name="api_posts"),
    path("api/v1/posts/<int:pk>/", api.post_detail, name="api_post_detail"),
    path("api/v1/posts/<int:pk>/like/", api.toggle_like, name="api_toggle_like"),
]
