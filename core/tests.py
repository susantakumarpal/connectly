import json

from django.contrib.auth.models import User
from django.test import Client, TestCase
from django.urls import reverse

from .forms import RegisterForm
from .models import Post


class PostsAPITests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="mira", password="test-password-42")
        self.other_user = User.objects.create_user(username="sam", password="test-password-42")

    def test_posts_api_requires_authentication(self):
        response = self.client.get(reverse("api_posts"))

        self.assertEqual(response.status_code, 401)

    def test_authenticated_user_can_create_and_list_posts(self):
        self.client.force_login(self.user)
        create_response = self.client.post(
            reverse("api_posts"),
            data=json.dumps({"content": "A post through the API"}),
            content_type="application/json",
        )

        self.assertEqual(create_response.status_code, 201)
        self.assertEqual(create_response.json()["author"]["username"], self.user.username)
        list_response = self.client.get(reverse("api_posts"))

        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(list_response.json()["count"], 1)

    def test_only_post_owner_can_delete_through_api(self):
        post = Post.objects.create(author=self.other_user, content="Owned by another user")
        self.client.force_login(self.user)

        response = self.client.delete(reverse("api_post_detail", args=[post.pk]))

        self.assertEqual(response.status_code, 403)
        self.assertTrue(Post.objects.filter(pk=post.pk).exists())

    def test_api_delete_returns_empty_success_response_for_owner(self):
        post = Post.objects.create(author=self.user, content="My post")
        self.client.force_login(self.user)

        response = self.client.delete(reverse("api_post_detail", args=[post.pk]))

        self.assertEqual(response.status_code, 204)
        self.assertEqual(response.content, b"")

    def test_api_rejects_non_string_post_content(self):
        self.client.force_login(self.user)

        response = self.client.post(
            reverse("api_posts"),
            data=json.dumps({"content": ["not", "text"]}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)

    def test_registration_rejects_duplicate_email_case_insensitively(self):
        self.user.email = "mira@example.com"
        self.user.save(update_fields=["email"])
        form = RegisterForm(
            {
                "username": "new-account",
                "email": "MIRA@example.com",
                "password1": "Tide!Flint2048",
                "password2": "Tide!Flint2048",
            }
        )

        self.assertFalse(form.is_valid())
        self.assertIn("email", form.errors)

    def test_session_login_endpoint_authenticates_user(self):
        response = self.client.post(
            reverse("api_login"),
            data=json.dumps({"username": "mira", "password": "test-password-42"}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.client.get(reverse("api_me")).json()["user"]["username"], "mira")

    def test_profile_api_does_not_disclose_email(self):
        self.other_user.email = "private@example.com"
        self.other_user.save(update_fields=["email"])
        self.client.force_login(self.user)

        response = self.client.get(reverse("api_profile", args=[self.other_user.username]))

        self.assertEqual(response.status_code, 200)
        self.assertNotIn("email", response.json()["user"])

    def test_user_can_follow_and_comment_through_api(self):
        post = Post.objects.create(author=self.other_user, content="A community post")
        self.client.force_login(self.user)

        follow_response = self.client.post(reverse("api_follow", args=[self.other_user.username]))
        comment_response = self.client.post(
            reverse("api_comments", args=[post.pk]),
            data=json.dumps({"text": "Thanks for sharing this."}),
            content_type="application/json",
        )

        self.assertEqual(follow_response.status_code, 200)
        self.assertTrue(follow_response.json()["is_following"])
        self.assertEqual(comment_response.status_code, 201)
        self.assertEqual(comment_response.json()["author"], self.user.username)

    def test_session_write_requires_csrf_token(self):
        client = Client(enforce_csrf_checks=True)
        client.force_login(self.user)
        token_response = client.get(reverse("api_csrf"))

        response = client.post(
            reverse("api_posts"),
            data=json.dumps({"content": "CSRF checked"}),
            content_type="application/json",
            HTTP_X_CSRFTOKEN=token_response.json()["csrfToken"],
        )

        self.assertEqual(response.status_code, 201)