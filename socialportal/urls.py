from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path, re_path

from core.spa import react_app

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/", include("core.api_urls")),
    path("login/", react_app, name="login"),
    path("logout/", react_app, name="logout"),
    path("register/", react_app, name="register"),
    path("settings/profile/", react_app, name="edit_profile"),
    path("post/<int:pk>/", react_app, name="post_detail"),
    path("u/<str:username>/", react_app, name="profile"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

urlpatterns += [re_path(r"^(?!api/|admin/|static/|media/).*$", react_app, name="react_app")]
