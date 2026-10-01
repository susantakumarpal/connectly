from django.urls import path

from . import api_v2

urlpatterns = [
    path("auth/csrf/", api_v2.csrf_token, name="api_csrf"),
    path("auth/me/", api_v2.current_user, name="api_me"),
    path("auth/login/", api_v2.login_user, name="api_login"),
    path("auth/register/", api_v2.register_user, name="api_register"),
    path("auth/logout/", api_v2.logout_user, name="api_logout"),
    path("auth/profile/", api_v2.update_profile, name="api_profile_update"),
    path("users/<str:username>/", api_v2.profile_detail, name="api_profile"),
    path("users/<str:username>/follow/", api_v2.toggle_follow, name="api_follow"),
    path("posts/", api_v2.posts_collection, name="api_posts"),
    path("posts/<int:pk>/", api_v2.post_detail, name="api_post_detail"),
    path("posts/<int:pk>/like/", api_v2.toggle_like, name="api_toggle_like"),
    path("posts/<int:pk>/comments/", api_v2.post_comments, name="api_comments"),
    path("search/", api_v2.search, name="api_search"),
]