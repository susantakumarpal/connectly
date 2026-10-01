from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User

from .models import Comment, Post, Profile


class BootstrapMixin:
    """Adds Bootstrap classes to every widget."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in self.fields.values():
            css = "form-control"
            if isinstance(field.widget, forms.ClearableFileInput):
                css = "form-control form-control-sm"
            field.widget.attrs["class"] = css


class RegisterForm(BootstrapMixin, UserCreationForm):
    email = forms.EmailField(required=True)

    def clean_email(self):
        email = self.cleaned_data["email"].strip().lower()
        if User.objects.filter(email__iexact=email).exists():
            raise forms.ValidationError("An account with this email address already exists.")
        return email

    class Meta:
        model = User
        fields = ("username", "email", "password1", "password2")


class PostForm(BootstrapMixin, forms.ModelForm):
    class Meta:
        model = Post
        fields = ("content", "image")
        widgets = {
            "content": forms.Textarea(attrs={"rows": 3, "placeholder": "What's on your mind?"}),
        }


class CommentForm(BootstrapMixin, forms.ModelForm):
    class Meta:
        model = Comment
        fields = ("text",)
        widgets = {"text": forms.TextInput(attrs={"placeholder": "Write a comment..."})}


class ProfileForm(BootstrapMixin, forms.ModelForm):
    class Meta:
        model = Profile
        fields = ("bio", "avatar")
        widgets = {"bio": forms.Textarea(attrs={"rows": 3})}
