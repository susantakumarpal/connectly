import { createContext, useContext, useEffect, useState } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Bookmark,
  Camera,
  Check,
  ChevronRight,
  Compass,
  Heart,
  House,
  Image as ImageIcon,
  LoaderCircle,
  LogOut,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Search,
  Send,
  Settings,
  Share2,
  Sparkles,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import {
  BrowserRouter,
  Link,
  NavLink,
  Navigate,
  Outlet,
  Route,
  Routes,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { api } from "./api.js";

const SessionContext = createContext(null);
const useSession = () => useContext(SessionContext);

function Logo({ inverse = false }) {
  return (
    <Link to="/feed" className={`flex items-center gap-3 ${inverse ? "text-white" : "text-ink"}`}>
      <span className={`grid size-10 place-items-center rounded-xl ${inverse ? "bg-lime text-leaf-dark" : "bg-leaf text-white"}`}>
        <Sparkles size={19} strokeWidth={2.4} />
      </span>
      <span className="display-font text-[1.65rem] leading-none">Connectly</span>
    </Link>
  );
}

function UserAvatar({ user, size = "normal" }) {
  const dimensions = size === "small" ? "size-9 text-xs" : size === "large" ? "size-24 text-3xl" : "size-11 text-sm";
  if (user?.avatar) {
    return <img className={`${dimensions} shrink-0 rounded-full object-cover ring-2 ring-white`} src={user.avatar} alt={`@${user.username}`} />;
  }
  return (
    <span className={`${dimensions} grid shrink-0 place-items-center rounded-full bg-[#dce8b8] font-semibold text-leaf-dark ring-2 ring-white`} aria-label={`@${user?.username || "member"}`}>
      {(user?.username || "C").slice(0, 1).toUpperCase()}
    </span>
  );
}

function LoadingMark({ label = "Loading" }) {
  return <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted"><LoaderCircle className="animate-spin" size={17} />{label}</div>;
}

function ErrorNotice({ message }) {
  if (!message) return null;
  return <p className="rounded-lg border border-[#efc7b9] bg-[#fff5f0] px-4 py-3 text-sm text-[#8a382c]" role="alert">{message}</p>;
}

function SearchBox({ compact = false }) {
  const [value, setValue] = useState("");
  const navigate = useNavigate();
  return (
    <form
      className={`group flex items-center gap-3 rounded-xl border border-line bg-white/75 px-4 transition focus-within:border-leaf/50 focus-within:bg-white ${compact ? "h-11" : "h-12"}`}
      onSubmit={(event) => {
        event.preventDefault();
        const query = value.trim();
        if (query) navigate(`/search?q=${encodeURIComponent(query)}`);
      }}
      role="search"
    >
      <Search size={17} className="shrink-0 text-muted" />
      <input className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#929b8e]" value={value} onChange={(event) => setValue(event.target.value)} placeholder="Find people or ideas" aria-label="Search Connectly" />
      {value && <button type="button" onClick={() => setValue("")} className="text-muted hover:text-ink" aria-label="Clear search"><X size={15} /></button>}
    </form>
  );
}

function SideLink({ to, icon: Icon, children }) {
  return (
    <NavLink to={to} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-4 py-3 text-[.94rem] font-medium transition ${isActive ? "bg-leaf text-white shadow-[0_7px_18px_rgba(27,97,73,.2)]" : "text-[#657168] hover:bg-white/80 hover:text-ink"}`}>
      <Icon size={19} strokeWidth={1.8} />{children}
    </NavLink>
  );
}

function AppLayout() {
  const { user, setUser, loading } = useSession();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await api("/auth/logout/", { method: "POST" });
      setUser(null);
      navigate("/login", { replace: true });
    } catch (error) {
      window.alert(error.message);
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen">
        <header className="flex h-[76px] items-center justify-between border-b border-line bg-paper/85 px-5 sm:px-10">
          <Logo />
          <div className="flex items-center gap-3 text-sm font-semibold">
            <Link className="rounded-lg px-3 py-2 text-muted hover:text-ink" to="/login">Log in</Link>
            <Link className="rounded-lg bg-leaf px-4 py-2.5 text-white transition hover:bg-leaf-dark" to="/register">Join Connectly <ArrowUpRight className="ml-1 inline" size={15} /></Link>
          </div>
        </header>
        <Outlet />
      </div>
    );
  }

  const navItems = [
    ["/feed", House, "Your feed"],
    ["/explore", Compass, "Explore"],
    ["/search", Search, "Search"],
  ];

  return (
    <div className="min-h-screen text-ink">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[250px] flex-col border-r border-line/90 bg-[#f7f8f1]/90 px-5 pb-6 pt-7 backdrop-blur-xl lg:flex">
        <Logo />
        <div className="mt-11 px-4 text-[.65rem] font-bold uppercase tracking-[.12em] text-[#a0a89e]">Your space</div>
        <nav className="mt-3 space-y-1.5" aria-label="Main navigation">
          {navItems.map(([to, icon, label]) => <SideLink key={to} to={to} icon={icon}>{label}</SideLink>)}
          <SideLink to={`/u/${user.username}`} icon={UserRound}>Your profile</SideLink>
        </nav>
        <div className="mt-auto rounded-2xl bg-leaf p-4 text-white">
          <div className="mb-3 flex size-9 items-center justify-center rounded-xl bg-lime text-leaf-dark"><Sparkles size={18} /></div>
          <p className="display-font text-xl">A little more human.</p>
          <p className="mt-1 text-xs leading-5 text-white/70">Good things grow when they’re shared.</p>
          <Link to="/explore" className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-lime">See what’s growing <ArrowRight size={14} /></Link>
        </div>
        <div className="mt-5 flex items-center gap-3 border-t border-line pt-5">
          <UserAvatar user={user} size="small" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">@{user.username}</p>
            <Link className="text-xs text-muted hover:text-leaf" to="/settings/profile">Account settings</Link>
          </div>
          <button className="grid size-9 place-items-center rounded-lg text-muted hover:bg-white hover:text-ink" onClick={handleLogout} title="Log out" aria-label="Log out"><LogOut size={17} /></button>
        </div>
      </aside>

      <div className="lg:pl-[250px]">
        <header className="sticky top-0 z-10 flex h-[68px] items-center justify-between border-b border-line/80 bg-paper/90 px-4 backdrop-blur-xl sm:px-7 lg:hidden">
          <Logo />
          <Link to="/settings/profile" aria-label="Edit your profile"><UserAvatar user={user} size="small" /></Link>
        </header>
        <div className="mx-auto grid max-w-[1420px] grid-cols-1 gap-8 px-4 pb-28 pt-6 sm:px-7 lg:px-10 lg:pt-9 xl:grid-cols-[minmax(0,720px)_270px] xl:gap-12">
          <main className="min-w-0"><Outlet /></main>
          <aside className="hidden xl:block">
            <div className="sticky top-9 space-y-8">
              <SearchBox compact />
              <RightRail />
              <p className="text-[.68rem] leading-5 text-[#9ba49a]">Connectly · {new Date().getFullYear()}<br />Made for the moments in between.</p>
            </div>
          </aside>
        </div>
      </div>
      <nav className="glass fixed inset-x-0 bottom-0 z-30 flex justify-around border-t border-line px-3 pb-[max(10px,env(safe-area-inset-bottom))] pt-2 lg:hidden" aria-label="Mobile navigation">
        {[["/feed", House, "Home"], ["/explore", Compass, "Explore"], ["/search", Search, "Search"], [`/u/${user.username}`, UserRound, "Profile"]].map(([to, Icon, label]) => (
          <NavLink key={to} to={to} className={({ isActive }) => `flex min-w-16 flex-col items-center gap-1 rounded-lg px-3 py-1.5 text-[.65rem] font-semibold ${isActive ? "text-leaf" : "text-muted"}`}><Icon size={20} strokeWidth={1.8} /><span>{label}</span></NavLink>
        ))}
      </nav>
    </div>
  );
}

function RightRail() {
  return (
    <section aria-label="Community notes">
      <div className="flex items-center justify-between border-b border-line pb-3">
        <h2 className="text-xs font-bold uppercase tracking-[.12em] text-[#7a867c]">Around here</h2>
        <Sparkles size={15} className="text-coral" />
      </div>
      <div className="space-y-5 py-5">
        <div className="flex gap-3"><span className="mt-1 size-2 shrink-0 rounded-full bg-coral" /><div><p className="text-sm font-semibold">Find your people</p><p className="mt-1 text-xs leading-5 text-muted">Meet someone new in Explore today.</p><Link to="/explore" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-leaf">Take a look <ArrowRight size={13} /></Link></div></div>
        <div className="flex gap-3"><span className="mt-1 size-2 shrink-0 rounded-full bg-[#a7bd58]" /><div><p className="text-sm font-semibold">Make room for good ideas</p><p className="mt-1 text-xs leading-5 text-muted">A thought shared is a thought in motion.</p></div></div>
      </div>
      <div className="rounded-2xl border border-[#e5dcc5] bg-[#f4eddf] p-4">
        <span className="text-[.66rem] font-bold uppercase tracking-[.12em] text-[#9a7551]">A small reminder</span>
        <p className="display-font mt-2 text-[1.35rem] leading-7 text-[#493d2c]">“The best conversations leave the door open.”</p>
      </div>
    </section>
  );
}

function Protected({ children }) {
  const { user, loading } = useSession();
  if (loading) return <LoadingMark />;
  return user ? children : <Navigate to="/login" replace />;
}

function GuestOnly({ children }) {
  const { user, loading } = useSession();
  if (loading) return <LoadingMark />;
  return user ? <Navigate to="/feed" replace /> : children;
}

function AuthPage({ mode }) {
  const isRegister = mode === "register";
  const { setUser } = useSession();
  const navigate = useNavigate();
  const [fields, setFields] = useState({ username: "", email: "", password1: "", password2: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const update = (event) => setFields((current) => ({ ...current, [event.target.name]: event.target.value }));

  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const endpoint = isRegister ? "/auth/register/" : "/auth/login/";
      const body = isRegister ? fields : { username: fields.username, password: fields.password1 };
      const response = await api(endpoint, { method: "POST", body });
      setUser(response.user);
      navigate("/feed", { replace: true });
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto grid min-h-[calc(100vh-76px)] max-w-[1160px] items-center gap-8 px-5 py-8 md:grid-cols-[1fr_.9fr] md:px-10 md:py-12">
      <section className="relative hidden min-h-[560px] overflow-hidden rounded-[8px] bg-leaf p-10 text-white md:flex md:flex-col md:justify-between lg:p-14">
        <div className="absolute -right-12 top-24 h-72 w-72 rounded-full border border-white/15" />
        <div className="absolute -right-2 top-36 h-52 w-52 rounded-full border border-white/15" />
        <div className="relative z-[1]"><Logo inverse /><p className="mt-16 max-w-md display-font text-5xl leading-[1.08] lg:text-[3.7rem]">A place for your <span className="text-lime">whole self.</span></p><p className="mt-5 max-w-sm text-sm leading-6 text-white/70">Good conversations, small discoveries, and the people who make them matter.</p></div>
        <div className="relative z-[1] flex items-end justify-between"><div className="flex -space-x-2"><span className="grid size-10 place-items-center rounded-full border-2 border-leaf bg-[#e7aa86] text-sm font-bold text-[#603a2a]">M</span><span className="grid size-10 place-items-center rounded-full border-2 border-leaf bg-[#d8e887] text-sm font-bold text-leaf">J</span><span className="grid size-10 place-items-center rounded-full border-2 border-leaf bg-[#d9c2e6] text-sm font-bold text-[#473856]">A</span></div><span className="display-font text-2xl text-white/80">Stay a little.</span></div>
      </section>
      <section className="mx-auto w-full max-w-[470px] rounded-[8px] border border-line bg-white/90 p-6 shadow-[0_20px_60px_rgba(40,61,43,.07)] sm:p-9 lg:p-11">
        <div className="mb-8 md:hidden"><Logo /></div>
        <p className="text-xs font-bold uppercase tracking-[.15em] text-leaf">{isRegister ? "Make yourself at home" : "Good to see you again"}</p>
        <h1 className="display-font mt-2 text-[2.4rem] leading-tight">{isRegister ? "Join the conversation." : "Welcome back."}</h1>
        <p className="mt-2 text-sm leading-6 text-muted">{isRegister ? "One account, plenty of room to be yourself." : "Pick up right where you left off."}</p>
        <form className="mt-8 space-y-4" onSubmit={submit}>
          <label className="block text-sm font-semibold">Username<input className="mt-2 h-12 w-full rounded-lg border border-line bg-[#fafbf7] px-3.5 text-sm outline-none transition focus:border-leaf" name="username" autoComplete="username" required value={fields.username} onChange={update} /></label>
          {isRegister && <label className="block text-sm font-semibold">Email address<input className="mt-2 h-12 w-full rounded-lg border border-line bg-[#fafbf7] px-3.5 text-sm outline-none transition focus:border-leaf" type="email" name="email" autoComplete="email" required value={fields.email} onChange={update} /></label>}
          <label className="block text-sm font-semibold">Password<input className="mt-2 h-12 w-full rounded-lg border border-line bg-[#fafbf7] px-3.5 text-sm outline-none transition focus:border-leaf" type="password" name="password1" autoComplete={isRegister ? "new-password" : "current-password"} required value={fields.password1} onChange={update} /></label>
          {isRegister && <label className="block text-sm font-semibold">Confirm password<input className="mt-2 h-12 w-full rounded-lg border border-line bg-[#fafbf7] px-3.5 text-sm outline-none transition focus:border-leaf" type="password" name="password2" autoComplete="new-password" required value={fields.password2} onChange={update} /></label>}
          <ErrorNotice message={error} />
          <button className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-leaf px-5 text-sm font-semibold text-white transition hover:bg-leaf-dark disabled:cursor-wait disabled:opacity-60" disabled={busy}>
            {busy ? <LoaderCircle className="animate-spin" size={17} /> : <>{isRegister ? "Create your account" : "Log in"}<ArrowRight size={17} /></>}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-muted">{isRegister ? "Already part of Connectly?" : "New around here?"} <Link to={isRegister ? "/login" : "/register"} className="font-semibold text-leaf hover:text-leaf-dark">{isRegister ? "Log in" : "Create an account"}</Link></p>
      </section>
    </main>
  );
}

function PageTitle({ eyebrow, title, detail, action }) {
  return <div className="mb-7 flex items-end justify-between gap-4"><div><p className="text-[.68rem] font-bold uppercase tracking-[.15em] text-leaf">{eyebrow}</p><h1 className="display-font mt-1 text-[2.35rem] leading-tight sm:text-[2.8rem]">{title}</h1>{detail && <p className="mt-2 max-w-xl text-sm leading-6 text-muted">{detail}</p>}</div>{action}</div>;
}

function usePosts(endpoint) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    api(endpoint).then((data) => { if (active) setPosts(data.results); }).catch((failure) => { if (active) setError(failure.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [endpoint, version]);
  return { posts, setPosts, loading, error, reload: () => setVersion((current) => current + 1) };
}

function FeedPage() {
  const collection = usePosts("/posts/?scope=feed");
  const { user } = useSession();
  return (
    <div className="soft-enter">
      <PageTitle eyebrow="Your people, your pace" title="The feed" detail="A collection of little things from your corner of Connectly." />
      <PostComposer onCreated={collection.reload} />
      <div className="mb-4 mt-8 flex items-center justify-between border-b border-line pb-3"><h2 className="text-sm font-bold">Fresh from your circle</h2><span className="text-xs text-muted">@{user.username}</span></div>
      <PostList {...collection} onRemoved={(id) => collection.setPosts((posts) => posts.filter((post) => post.id !== id))} />
    </div>
  );
}

function ExplorePage() {
  const collection = usePosts("/posts/?scope=explore&limit=40");
  return <div className="soft-enter"><PageTitle eyebrow="Out in the open" title="Explore" detail="Notes, photos, and ideas shared by the Connectly community." /><PostList {...collection} onRemoved={(id) => collection.setPosts((posts) => posts.filter((post) => post.id !== id))} /></div>;
}

function PostList({ posts = [], loading, error, onRemoved }) {
  if (loading) return <LoadingMark label="Finding the good stuff" />;
  if (error) return <ErrorNotice message={error} />;
  if (!posts.length) return <div className="rounded-[8px] border border-dashed border-[#cbd5c6] bg-white/45 px-5 py-12 text-center"><Sparkles className="mx-auto text-coral" size={22} /><p className="display-font mt-3 text-2xl">A little quiet, for now.</p><p className="mt-1 text-sm text-muted">Check out Explore or leave the first note.</p></div>;
  return <div className="space-y-4">{posts.map((post) => <PostCard key={post.id} post={post} onRemoved={onRemoved} />)}</div>;
}

function PostComposer({ onCreated }) {
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const preview = file ? URL.createObjectURL(file) : null;
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  async function submit(event) {
    event.preventDefault();
    if (!content.trim()) return;
    setError("");
    setBusy(true);
    const body = new FormData();
    body.set("content", content.trim());
    if (file) body.set("image", file);
    try {
      await api("/posts/", { method: "POST", body });
      setContent("");
      setFile(null);
      onCreated();
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="rounded-[8px] border border-line bg-white/90 p-4 shadow-[0_10px_35px_rgba(41,59,42,.045)] sm:p-5" onSubmit={submit}>
      <div className="flex gap-3"><UserAvatar user={useSession().user} /><textarea className="min-h-[82px] flex-1 resize-y bg-transparent py-2 text-[.95rem] leading-6 outline-none placeholder:text-[#929b8e]" maxLength={1000} value={content} onChange={(event) => setContent(event.target.value)} placeholder="What’s on your mind?" aria-label="Write a post" /></div>
      {preview && <div className="relative ml-14 mt-2 max-w-[240px]"><img className="max-h-52 rounded-lg object-cover" src={preview} alt="Selected upload preview" /><button type="button" className="absolute -right-2 -top-2 grid size-7 place-items-center rounded-full bg-ink text-white" onClick={() => setFile(null)} aria-label="Remove image"><X size={15} /></button></div>}
      <ErrorNotice message={error} />
      <div className="mt-3 flex items-center justify-between border-t border-line pt-3"><label className="inline-flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-xs font-semibold text-muted transition hover:bg-paper hover:text-leaf"><ImageIcon size={17} /> Add a photo<input className="sr-only" type="file" accept="image/*" onChange={(event) => setFile(event.target.files?.[0] || null)} /></label><div className="flex items-center gap-3"><span className="hidden text-[.68rem] text-muted sm:inline">{content.length}/1000</span><button className="inline-flex h-10 items-center gap-2 rounded-lg bg-leaf px-4 text-xs font-bold text-white transition hover:bg-leaf-dark disabled:opacity-50" disabled={busy || !content.trim()}>{busy ? <LoaderCircle className="animate-spin" size={15} /> : <><Send size={14} /> Share</>}</button></div></div>
    </form>
  );
}

function relativeTime(value) {
  const minutes = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days < 7 ? `${days}d ago` : new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function PostCard({ post, onRemoved }) {
  const { user } = useSession();
  const [liked, setLiked] = useState(post.liked_by_user);
  const [likes, setLikes] = useState(post.likes_count);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  async function toggleLike() {
    setError("");
    setLiked((current) => !current);
    setLikes((count) => count + (liked ? -1 : 1));
    try {
      const result = await api(`/posts/${post.id}/like/`, { method: "POST", body: {} });
      setLiked(result.liked);
      setLikes(result.likes_count);
    } catch (failure) {
      setLiked(liked);
      setLikes(post.likes_count);
      setError(failure.message);
    }
  }

  async function deletePost() {
    if (!window.confirm("Delete this post?")) return;
    try {
      await api(`/posts/${post.id}/`, { method: "DELETE" });
      onRemoved?.(post.id);
    } catch (failure) {
      setError(failure.message);
    }
  }

  async function sharePost() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setError("Could not copy this link.");
    }
  }

  return (
    <article className="overflow-hidden rounded-[8px] border border-line bg-white/90 shadow-[0_10px_35px_rgba(41,59,42,.045)]">
      <div className="flex items-center gap-3 px-4 pb-2 pt-4 sm:px-5 sm:pt-5">
        <Link to={`/u/${post.author.username}`}><UserAvatar user={post.author} size="small" /></Link>
        <div className="min-w-0 flex-1"><Link className="text-sm font-bold hover:text-leaf" to={`/u/${post.author.username}`}>@{post.author.username}</Link><p className="mt-0.5 text-[.7rem] text-muted">{relativeTime(post.created_at)}</p></div>
        {user.username === post.author.username && <button className="grid size-9 place-items-center rounded-full text-muted hover:bg-paper hover:text-coral" onClick={deletePost} title="Delete post" aria-label="Delete post"><MoreHorizontal size={19} /></button>}
      </div>
      <Link to={`/post/${post.id}`} className="block px-4 py-2 sm:px-5"><p className="whitespace-pre-wrap break-words text-[.93rem] leading-7">{post.content}</p>{post.image && <img className="mt-3 max-h-[560px] w-full rounded-[6px] object-cover" src={post.image} alt={`Photo shared by @${post.author.username}`} />}</Link>
      {error && <div className="px-5 pb-2"><ErrorNotice message={error} /></div>}
      <div className="mx-4 flex items-center justify-between border-t border-line py-3 sm:mx-5">
        <div className="flex items-center gap-1">
          <button className={`inline-flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold transition ${liked ? "text-coral" : "text-muted hover:bg-[#fff3ed] hover:text-coral"}`} onClick={toggleLike} aria-label={liked ? "Unlike post" : "Like post"}><Heart size={17} fill={liked ? "currentColor" : "none"} />{likes}</button>
          <Link to={`/post/${post.id}`} className="inline-flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-muted transition hover:bg-[#edf3e6] hover:text-leaf"><MessageCircle size={17} />{post.comments_count}</Link>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-muted transition hover:bg-paper hover:text-leaf" onClick={sharePost} aria-label="Copy post link">{copied ? <Check size={16} /> : <Share2 size={16} />}{copied ? "Copied" : "Share"}</button>
      </div>
    </article>
  );
}

function ProfilePage() {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const collection = usePosts(`/posts/?username=${encodeURIComponent(username)}`);
  useEffect(() => {
    let active = true;
    setLoading(true);
    api(`/users/${encodeURIComponent(username)}/`).then((response) => { if (active) setProfile(response.user); }).catch((failure) => { if (active) setError(failure.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [username]);

  async function toggleFollow() {
    const method = profile.is_following ? "DELETE" : "POST";
    try {
      const result = await api(`/users/${encodeURIComponent(username)}/follow/`, { method, body: {} });
      setProfile((current) => ({ ...current, is_following: result.is_following, followers_count: result.followers_count }));
    } catch (failure) {
      setError(failure.message);
    }
  }

  if (loading) return <LoadingMark />;
  if (!profile) return <ErrorNotice message={error || "We couldn’t find this profile."} />;
  return (
    <div className="soft-enter">
      <div className="relative mb-7 overflow-hidden rounded-[8px] border border-line bg-white/90">
        <div className="h-32 bg-[linear-gradient(115deg,#164a38_0%,#226b4f_58%,#9bab61_100%)] sm:h-44"><div className="h-full w-full opacity-25" style={{ backgroundImage: "repeating-linear-gradient(135deg,transparent,transparent 14px,rgba(255,255,255,.22) 14px,rgba(255,255,255,.22) 15px)" }} /></div>
        <div className="flex flex-col gap-4 px-5 pb-5 sm:flex-row sm:items-end sm:px-7">
          <div className="-mt-12"><UserAvatar user={profile} size="large" /></div>
          <div className="min-w-0 flex-1 sm:pb-1"><h1 className="display-font text-3xl">@{profile.username}</h1><p className="mt-1 max-w-lg text-sm leading-6 text-muted">{profile.bio || "No bio yet."}</p></div>
          <div className="flex gap-2 sm:pb-1">{profile.is_self ? <Link to="/settings/profile" className="inline-flex h-10 items-center gap-2 rounded-lg border border-line px-4 text-xs font-bold hover:border-leaf hover:text-leaf"><Settings size={15} /> Edit profile</Link> : <button onClick={toggleFollow} className={`h-10 rounded-lg px-5 text-xs font-bold transition ${profile.is_following ? "border border-line bg-white text-ink hover:border-coral hover:text-coral" : "bg-leaf text-white hover:bg-leaf-dark"}`}>{profile.is_following ? "Following" : "Follow"}</button>}</div>
        </div>
        <div className="flex gap-6 border-t border-line px-5 py-3.5 text-xs text-muted sm:px-7"><span><strong className="text-ink">{profile.posts_count}</strong> posts</span><span><strong className="text-ink">{profile.followers_count}</strong> followers</span><span><strong className="text-ink">{profile.following_count}</strong> following</span></div>
      </div>
      <ErrorNotice message={error} />
      <PostList {...collection} onRemoved={(id) => collection.setPosts((posts) => posts.filter((post) => post.id !== id))} />
    </div>
  );
}

function SearchPage() {
  const [params] = useSearchParams();
  const query = params.get("q") || "";
  const [results, setResults] = useState({ users: [], posts: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!query) { setResults({ users: [], posts: [] }); return undefined; }
    let active = true;
    setLoading(true);
    api(`/search/?q=${encodeURIComponent(query)}`).then((data) => { if (active) setResults(data); }).catch((failure) => { if (active) setError(failure.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [query]);
  return (
    <div className="soft-enter">
      <PageTitle eyebrow="A good place to start" title="Search" detail={query ? `Showing people and posts for “${query}”.` : "Look for someone or follow an idea."} />
      <div className="mb-7 xl:hidden"><SearchBox /></div>
      {!query ? <div className="rounded-[8px] border border-dashed border-[#cbd5c6] bg-white/45 px-5 py-12 text-center"><Search className="mx-auto text-leaf" size={23} /><p className="display-font mt-3 text-2xl">What are you curious about?</p></div> : loading ? <LoadingMark /> : error ? <ErrorNotice message={error} /> : <div className="space-y-8">
        {!!results.users.length && <section><h2 className="mb-3 text-sm font-bold">People <span className="ml-1 font-normal text-muted">{results.users.length}</span></h2><div className="divide-y divide-line rounded-[8px] border border-line bg-white/90">{results.users.map((person) => <Link key={person.id} to={`/u/${person.username}`} className="flex items-center gap-3 p-4 transition hover:bg-[#f8faf4]"><UserAvatar user={person} size="small" /><div className="flex-1"><p className="text-sm font-bold">@{person.username}</p><p className="mt-0.5 line-clamp-1 text-xs text-muted">{person.bio || "Connectly member"}</p></div><ChevronRight size={17} className="text-muted" /></Link>)}</div></section>}
        {!!results.posts.length && <section><h2 className="mb-3 text-sm font-bold">Posts <span className="ml-1 font-normal text-muted">{results.posts.length}</span></h2><div className="space-y-4">{results.posts.map((post) => <PostCard key={post.id} post={post} />)}</div></section>}
        {!results.users.length && !results.posts.length && <p className="rounded-[8px] border border-line bg-white/75 px-5 py-10 text-center text-sm text-muted">No matches just yet. Try another search.</p>}
      </div>}
    </div>
  );
}

function PostDetailPage() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([api(`/posts/${id}/`), api(`/posts/${id}/comments/`)]).then(([postData, commentData]) => { if (active) { setPost(postData); setComments(commentData.results); } }).catch((failure) => { if (active) setError(failure.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  async function submitComment(event) {
    event.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    setError("");
    try {
      const comment = await api(`/posts/${id}/comments/`, { method: "POST", body: { text } });
      setComments((current) => [...current, comment]);
      setPost((current) => ({ ...current, comments_count: current.comments_count + 1 }));
      setText("");
    } catch (failure) { setError(failure.message); } finally { setBusy(false); }
  }

  if (loading) return <LoadingMark />;
  if (!post) return <ErrorNotice message={error || "This post is no longer available."} />;
  return <div className="soft-enter"><Link to="/feed" className="mb-5 inline-flex items-center gap-2 text-xs font-semibold text-muted hover:text-leaf"><ArrowDownRight className="rotate-45" size={15} /> Back to your feed</Link><PostCard post={post} /><section className="mt-6 rounded-[8px] border border-line bg-white/90 p-4 sm:p-5"><div className="mb-4 flex items-center gap-2"><MessageCircle size={17} className="text-leaf" /><h2 className="text-sm font-bold">Conversation <span className="ml-1 text-muted">{comments.length}</span></h2></div><div className="space-y-4">{comments.map((comment) => <div key={comment.id} className="flex gap-3"><UserAvatar user={{ username: comment.author }} size="small" /><div className="min-w-0 flex-1 rounded-lg bg-paper px-3.5 py-3"><div className="flex items-center justify-between gap-2"><Link to={`/u/${comment.author}`} className="text-xs font-bold hover:text-leaf">@{comment.author}</Link><time className="text-[.65rem] text-muted">{relativeTime(comment.created_at)}</time></div><p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6">{comment.text}</p></div></div>)}</div><form className="mt-5 border-t border-line pt-4" onSubmit={submitComment}><textarea className="min-h-20 w-full resize-y rounded-lg border border-line bg-[#fafbf7] p-3 text-sm leading-6 outline-none focus:border-leaf" maxLength={500} value={text} onChange={(event) => setText(event.target.value)} placeholder="Add something kind to the conversation…" aria-label="Write a comment" /><div className="mt-2 flex items-center justify-between"><ErrorNotice message={error} /><button className="inline-flex h-9 items-center gap-2 rounded-lg bg-leaf px-3.5 text-xs font-bold text-white hover:bg-leaf-dark disabled:opacity-50" disabled={busy || !text.trim()}>{busy ? <LoaderCircle className="animate-spin" size={14} /> : <><Send size={13} /> Reply</>}</button></div></form></section></div>;
}

function ProfileSettingsPage() {
  const { user, setUser } = useSession();
  const [bio, setBio] = useState(user.bio || "");
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const preview = file ? URL.createObjectURL(file) : user.avatar;
  useEffect(() => () => { if (file && preview) URL.revokeObjectURL(preview); }, [file, preview]);

  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    setError("");
    const form = new FormData();
    form.set("bio", bio);
    if (file) form.set("avatar", file);
    try {
      const response = await api("/auth/profile/", { method: "POST", body: form });
      setUser(response.user);
      setFile(null);
      setNotice("Your profile is up to date.");
    } catch (failure) { setError(failure.message); } finally { setBusy(false); }
  }

  return <div className="soft-enter max-w-2xl"><PageTitle eyebrow="The details people see" title="Your profile" detail="Keep the essentials current. You can change these whenever you like." /><form className="rounded-[8px] border border-line bg-white/90 p-5 shadow-[0_10px_35px_rgba(41,59,42,.045)] sm:p-7" onSubmit={save}><div className="flex items-center gap-4 border-b border-line pb-6"><UserAvatar user={{ ...user, avatar: preview }} size="large" /><label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-line px-4 text-xs font-bold hover:border-leaf hover:text-leaf"><Camera size={16} /> Change photo<input className="sr-only" type="file" accept="image/*" onChange={(event) => setFile(event.target.files?.[0] || null)} /></label></div><div className="mt-6"><label className="text-sm font-bold" htmlFor="bio">Short bio</label><textarea id="bio" className="mt-2 min-h-32 w-full resize-y rounded-lg border border-line bg-[#fafbf7] p-3.5 text-sm leading-6 outline-none focus:border-leaf" maxLength={300} value={bio} onChange={(event) => setBio(event.target.value)} placeholder="A few words about what you’re into…" /><p className="mt-1 text-right text-[.68rem] text-muted">{bio.length}/300</p></div><div className="mt-5 flex items-center justify-between gap-3"><div>{notice && <p className="flex items-center gap-1.5 text-xs font-semibold text-leaf"><Check size={15} />{notice}</p>}<ErrorNotice message={error} /></div><button className="inline-flex h-10 items-center gap-2 rounded-lg bg-leaf px-4 text-xs font-bold text-white hover:bg-leaf-dark disabled:opacity-50" disabled={busy}>{busy ? <LoaderCircle className="animate-spin" size={15} /> : "Save changes"}</button></div></form></div>;
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    api("/auth/csrf/").catch(() => null).then(() => api("/auth/me/").then((response) => { if (active) setUser(response.user); }).catch(() => { if (active) setUser(null); })).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <SessionContext.Provider value={{ user, setUser, loading }}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to={user ? "/feed" : "/login"} replace />} />
            <Route path="login" element={<GuestOnly><AuthPage mode="login" /></GuestOnly>} />
            <Route path="register" element={<GuestOnly><AuthPage mode="register" /></GuestOnly>} />
            <Route path="feed" element={<Protected><FeedPage /></Protected>} />
            <Route path="explore" element={<Protected><ExplorePage /></Protected>} />
            <Route path="search" element={<Protected><SearchPage /></Protected>} />
            <Route path="u/:username" element={<Protected><ProfilePage /></Protected>} />
            <Route path="post/:id" element={<Protected><PostDetailPage /></Protected>} />
            <Route path="settings/profile" element={<Protected><ProfileSettingsPage /></Protected>} />
            <Route path="*" element={<Navigate to={user ? "/feed" : "/login"} replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </SessionContext.Provider>
  );
}

export default App;import {
  ArrowRight,
  Camera,
  Check,
  ChevronDown,
  Compass,
  Heart,
  HeartHandshake,
  House,
  Image as ImageIcon,
  LogOut,
  Menu,
  MessageCircle,
  MoreHorizontal,
  Search,
  Send,
  Settings2,
  Sparkles,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  Link,
  NavLink,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { api, primeCsrf } from "./api.js";

const AppContext = createContext(null);
const useApp = () => useContext(AppContext);

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    primeCsrf()
      .then(() => api("/api/v1/auth/session/"))
      .then(({ user: currentUser }) => active && setUser(currentUser))
      .catch(() => active && setUser(null))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  function notify(message) {
    setNotice(message);
    window.clearTimeout(notify.timer);
    notify.timer = window.setTimeout(() => setNotice(""), 3200);
  }

  return (
    <AppContext.Provider value={{ user, setUser, notify }}>
      {loading ? <LoadingScreen /> : (
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" replace /> : <AuthPage mode="login" />} />
          <Route path="/register" element={user ? <Navigate to="/" replace /> : <AuthPage mode="register" />} />
          <Route element={user ? <AppShell /> : <Navigate to="/login" replace />}>
            <Route index element={<PostsPage scope="feed" />} />
            <Route path="explore" element={<PostsPage scope="explore" />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="u/:username" element={<ProfilePage />} />
            <Route path="settings/profile" element={<EditProfilePage />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      )}
      {notice && <div className="toast-note" role="status">{notice}</div>}
    </AppContext.Provider>
  );
}

function LoadingScreen() {
  return <main className="loading-screen"><span className="brand-symbol"><HeartHandshake size={25} /></span><span>Connectly</span></main>;
}

function AuthPage({ mode }) {
  const { setUser, notify } = useApp();
  const navigate = useNavigate();
  const isRegister = mode === "register";
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const result = await api(`/api/v1/auth/${isRegister ? "register" : "login"}/`, {
        method: "POST",
        body: form,
      });
      setUser(result.user);
      notify(isRegister ? "Your account is ready." : "Welcome back.");
      navigate("/");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-story">
        <Link className="brand-lockup" to="/login"><span className="brand-symbol"><HeartHandshake size={23} /></span>Connectly</Link>
        <div className="auth-story-copy">
          <span className="eyebrow"><Sparkles size={14} /> A little closer, every day</span>
          <h1>Good things<br />happen <em>together.</em></h1>
          <p>Find your people. Keep the small moments close.</p>
        </div>
        <div className="auth-photo-wrap">
          <img className="auth-photo" src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=85" alt="Friends spending time together outdoors" />
          <span className="photo-caption">Room for your kind of people <span>✳</span></span>
        </div>
        <div className="story-footer"><span>Made for sharing the everyday.</span><span>01 / 03</span></div>
      </section>
      <section className="auth-form-side">
        <div className="auth-form-top"><span>{isRegister ? "Already here?" : "New to Connectly?"}</span><Link to={isRegister ? "/login" : "/register"}>{isRegister ? "Log in" : "Create an account"}<ArrowRight size={15} /></Link></div>
        <form className="auth-form" onSubmit={submit}>
          <div className="mobile-brand"><span className="brand-symbol"><HeartHandshake size={22} /></span>Connectly</div>
          <span className="eyebrow">{isRegister ? "Your corner of the internet" : "Pick up where you left off"}</span>
          <h2>{isRegister ? "Make yourself at home." : "Welcome back."}</h2>
          <p className="auth-subtitle">{isRegister ? "A few details and you're in." : "Your people are right where you left them."}</p>
          {error && <div className="form-error" role="alert">{error}</div>}
          {isRegister && <Field label="Email address" name="email" type="email" placeholder="you@example.com" autoComplete="email" />}
          <Field label="Username" name="username" placeholder="Your username" autoComplete="username" />
          {isRegister && <Field label="Password" name="password1" type="password" placeholder="At least 8 characters" autoComplete="new-password" />}
          <Field label="Password" name={isRegister ? "password2" : "password"} type="password" placeholder={isRegister ? "Confirm password" : "Your password"} autoComplete={isRegister ? "new-password" : "current-password"} />
          {!isRegister && <div className="form-meta"><label className="remember-row"><input type="checkbox" /> <span>Keep me signed in</span></label><span className="secure-note">Private by default</span></div>}
          <button className="button button-primary auth-submit" disabled={busy}>{busy ? "One moment…" : isRegister ? "Create your account" : "Log in"}<ArrowRight size={17} /></button>
          <p className="legal-note">By continuing, you agree to keep this a kind place for everyone.</p>
        </form>
        <span className="auth-copyright">© 2026 Connectly</span>
      </section>
    </main>
  );
}

function Field({ label, name, type = "text", ...props }) {
  return <label className="field-label">{label}<input className="field-input" name={name} type={type} required {...props} /></label>;
}

function AppShell() {
  const { user, setUser, notify } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchText, setSearchText] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    try {
      await api("/api/v1/auth/logout/", { method: "POST" });
      setUser(null);
      navigate("/login");
    } catch (error) {
      notify(error.message);
    } finally {
      setSigningOut(false);
    }
  }

  function submitSearch(event) {
    event.preventDefault();
    const query = searchText.trim();
    if (query) navigate(`/search?q=${encodeURIComponent(query)}`);
  }

  useEffect(() => setMenuOpen(false), [location.pathname]);

  return (
    <div className="app-frame">
      <header className="mobile-topbar">
        <Link className="brand-lockup" to="/"><span className="brand-symbol"><HeartHandshake size={21} /></span>Connectly</Link>
        <button className="icon-button mobile-menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu"><Menu size={20} /></button>
      </header>
      <div className="app-grid">
        <aside className={`left-rail ${menuOpen ? "left-rail-open" : ""}`}>
          <Link className="brand-lockup desktop-brand" to="/"><span className="brand-symbol"><HeartHandshake size={23} /></span>Connectly</Link>
          <form className="rail-search" onSubmit={submitSearch}><Search size={16} /><input aria-label="Search" placeholder="Search anything" value={searchText} onChange={(event) => setSearchText(event.target.value)} /></form>
          <span className="rail-label">YOUR SPACE</span>
          <nav className="main-nav" aria-label="Main navigation">
            <NavItem to="/" icon={House} label="Your feed" end />
            <NavItem to="/explore" icon={Compass} label="Explore" />
            <NavItem to={`/u/${user.username}`} icon={UserRound} label="Your profile" />
          </nav>
          <div className="rail-bottom">
            <div className="rail-note"><span className="note-icon"><Sparkles size={15} /></span><span><strong>Little moments matter.</strong><small>Make room for more of them.</small></span></div>
            <button className="account-row" onClick={() => setMenuOpen(!menuOpen)}>
              <Avatar user={user} size="small" /><span className="account-copy"><strong>{user.username}</strong><small>Personal account</small></span><ChevronDown size={15} />
            </button>
            {menuOpen && <div className="account-menu"><Link to="/settings/profile"><Settings2 size={15} /> Edit profile</Link><button onClick={signOut} disabled={signingOut}><LogOut size={15} /> {signingOut ? "Logging out…" : "Log out"}</button></div>}
          </div>
        </aside>

        <main className="main-pane"><Outlet /></main>

        <aside className="right-rail">
          <div className="right-greeting"><span className="eyebrow">YOUR SPACE, YOUR PACE</span><h2>Stay a little<br /><em>connected.</em></h2><p>Keep up with people who make the ordinary feel special.</p></div>
          <div className="right-divider" />
          <span className="rail-label">QUICK LINKS</span>
          <Link className="quick-link" to="/explore"><span className="quick-icon mint"><Compass size={17} /></span><span><strong>Find something new</strong><small>Explore recent posts</small></span><ArrowRight size={15} /></Link>
          <Link className="quick-link" to={`/u/${user.username}`}><span className="quick-icon coral"><UserRound size={17} /></span><span><strong>Your profile</strong><small>Make it feel like you</small></span><ArrowRight size={15} /></Link>
          <div className="right-footer"><span>Connectly</span><span>Made for real life.</span></div>
        </aside>
      </div>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        <NavItem to="/" icon={House} label="Home" end compact />
        <NavItem to="/explore" icon={Compass} label="Explore" compact />
        <NavItem to={`/u/${user.username}`} icon={UserRound} label="Profile" compact />
        <button className="mobile-nav-item" onClick={signOut} aria-label="Log out"><LogOut size={19} /><span>Log out</span></button>
      </nav>
    </div>
  );
}

function NavItem({ to, icon: Icon, label, end = false, compact = false }) {
  return <NavLink end={end} to={to} className={({ isActive }) => `nav-item ${isActive ? "nav-item-active" : ""} ${compact ? "nav-item-compact" : ""}`}><Icon size={19} strokeWidth={1.8} /><span>{label}</span></NavLink>;
}

function Avatar({ user, size = "", className = "" }) {
  const label = user?.username?.slice(0, 1).toUpperCase() || "?";
  return <span className={`avatar ${size ? `avatar-${size}` : ""} ${className}`}>{user?.avatar ? <img src={user.avatar} alt="" /> : label}</span>;
}

function PageHeading({ eyebrow, title, description, action }) {
  return <div className="page-heading"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1>{description && <p>{description}</p>}</div>{action}</div>;
}

function PostsPage({ scope }) {
  const { notify } = useApp();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    api(`/api/v1/posts/?scope=${scope}`)
      .then((data) => active && setPosts(data.results))
      .catch((requestError) => active && setError(requestError.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [scope]);

  const title = scope === "feed" ? "Your feed" : "Explore";
  return <>
    <PageHeading eyebrow={scope === "feed" ? "YOUR PEOPLE, LATELY" : "OUT IN THE OPEN"} title={title} description={scope === "feed" ? "A little window into everyone you follow." : "A few good things from around Connectly."} />
    {scope === "feed" && <Composer onCreated={(post) => { setPosts((current) => [post, ...current]); notify("Your post is out there."); }} />}
    {error && <div className="inline-error">{error}</div>}
    {loading ? <PostSkeletons /> : posts.length ? <div className="post-list">{posts.map((post) => <PostCard key={post.id} post={post} onDeleted={() => setPosts((current) => current.filter((item) => item.id !== post.id))} />)}</div> : <EmptyState scope={scope} />}
  </>;
}

function Composer({ onCreated }) {
  const { user } = useApp();
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [busy, setBusy] = useState(false);
  const fileInput = useRef(null);

  async function submit(event) {
    event.preventDefault();
    if (!content.trim() && !image) return;
    setBusy(true);
    const form = new FormData();
    form.append("content", content);
    if (image) form.append("image", image);
    try {
      onCreated(await api("/api/v1/posts/", { method: "POST", body: form }));
      setContent("");
      setImage(null);
      if (fileInput.current) fileInput.current.value = "";
    } catch (error) {
      window.alert(error.message);
    } finally {
      setBusy(false);
    }
  }

  return <form className="composer" onSubmit={submit}>
    <div className="composer-top"><Avatar user={user} /><textarea aria-label="Write a post" maxLength={1000} value={content} onChange={(event) => setContent(event.target.value)} placeholder="What has your day been like?" rows={2} /></div>
    {image && <div className="attachment-chip"><ImageIcon size={15} /><span>{image.name}</span><button type="button" onClick={() => { setImage(null); fileInput.current.value = ""; }} aria-label="Remove image"><X size={15} /></button></div>}
    <div className="composer-bottom"><div className="composer-tools"><input ref={fileInput} className="sr-only" type="file" accept="image/*" onChange={(event) => setImage(event.target.files[0] || null)} /><button className="tool-button" type="button" onClick={() => fileInput.current?.click()}><ImageIcon size={17} /><span>Photo</span></button><span className="character-count">{content.length}/1000</span></div><button className="button button-primary button-small" disabled={busy || (!content.trim() && !image)}>{busy ? "Sharing…" : "Share post"}<Send size={14} /></button></div>
  </form>;
}

function PostCard({ post, onDeleted }) {
  const { user, notify } = useApp();
  const [liked, setLiked] = useState(post.liked_by_user);
  const [likeCount, setLikeCount] = useState(post.likes_count);
  const [comments, setComments] = useState([]);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [busy, setBusy] = useState(false);

  async function toggleLike() {
    try {
      const result = await api(`/api/v1/posts/${post.id}/like/`, { method: "POST", body: {} });
      setLiked(result.liked);
      setLikeCount(result.likes_count);
    } catch (error) { notify(error.message); }
  }

  async function toggleComments() {
    if (!commentsOpen && comments.length === 0) {
      try {
        const result = await api(`/api/v1/posts/${post.id}/comments/`);
        setComments(result.results);
      } catch (error) { notify(error.message); }
    }
    setCommentsOpen((open) => !open);
  }

  async function addComment(event) {
    event.preventDefault();
    if (!commentText.trim()) return;
    setBusy(true);
    try {
      const comment = await api(`/api/v1/posts/${post.id}/comments/`, { method: "POST", body: { text: commentText } });
      setComments((current) => [...current, comment]);
      setCommentText("");
    } catch (error) { notify(error.message); }
    finally { setBusy(false); }
  }

  async function removePost() {
    if (!window.confirm("Delete this post?")) return;
    try {
      await api(`/api/v1/posts/${post.id}/`, { method: "DELETE" });
      onDeleted?.();
      notify("Post deleted.");
    } catch (error) { notify(error.message); }
  }

  return <article className="post-card">
    <div className="post-head"><Link className="author-link" to={`/u/${post.author.username}`}><Avatar user={post.author} /><span><strong>{post.author.username}</strong><small>{timeAgo(post.created_at)}</small></span></Link>{post.author.username === user.username && <button className="icon-button post-more" onClick={removePost} aria-label="Delete post" title="Delete post"><MoreHorizontal size={20} /></button>}</div>
    {post.content && <p className="post-copy">{post.content}</p>}
    {post.image && <img className="post-media" src={post.image} alt="Shared by the author" loading="lazy" />}
    <div className="post-actions"><button className={`post-action ${liked ? "post-action-liked" : ""}`} onClick={toggleLike} aria-label={liked ? "Unlike post" : "Like post"}><Heart size={18} fill={liked ? "currentColor" : "none"} /><span>{likeCount}</span></button><button className="post-action" onClick={toggleComments}><MessageCircle size={18} /><span>{post.comments_count + comments.length}</span></button><span className="post-action-spacer" /><button className="post-action share-action" onClick={() => { navigator.clipboard?.writeText(window.location.origin + `/u/${post.author.username}`); notify("Profile link copied."); }} aria-label="Copy profile link"><ArrowRight size={17} /></button></div>
    {commentsOpen && <div className="comment-thread"><div className="comment-list">{comments.length ? comments.map((comment) => <div className="comment-row" key={comment.id}><Avatar user={{ username: comment.author, avatar: comment.avatar }} size="tiny" /><p><strong>{comment.author}</strong> {comment.text}</p></div>) : <span className="comment-empty">Start the conversation.</span>}</div><form className="comment-form" onSubmit={addComment}><input aria-label="Write a comment" value={commentText} onChange={(event) => setCommentText(event.target.value)} placeholder="Add a thoughtful reply…" maxLength={500} /><button className="icon-button" disabled={busy || !commentText.trim()} aria-label="Send comment"><Send size={16} /></button></form></div>}
  </article>;
}

function SearchPage() {
  const location = useLocation();
  const query = new URLSearchParams(location.search).get("q") || "";
  const [results, setResults] = useState({ users: [], posts: [] });
  const [loading, setLoading] = useState(true);
  const { notify } = useApp();

  useEffect(() => {
    let active = true;
    setLoading(true);
    api(`/api/v1/search/?q=${encodeURIComponent(query)}`)
      .then((data) => active && setResults(data))
      .catch((error) => active && notify(error.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [query]);

  return <><PageHeading eyebrow="A GOOD PLACE TO START" title="Search" description={query ? `Showing results for “${query}”` : "Find people and posts."} />{loading ? <PostSkeletons /> : <>
    {!!results.users.length && <section className="search-section"><div className="section-title-row"><h2>People</h2><span>{results.users.length} found</span></div><div className="people-results">{results.users.map((person) => <Link className="person-result" to={`/u/${person.username}`} key={person.username}><Avatar user={person} /><span><strong>{person.username}</strong><small>{person.bio || "A Connectly member"}</small></span><ArrowRight size={16} /></Link>)}</div></section>}
    {!!results.posts.length && <section className="search-section"><div className="section-title-row"><h2>Posts</h2><span>{results.posts.length} found</span></div><div className="post-list">{results.posts.map((post) => <PostCard key={post.id} post={post} />)}</div></section>}
    {!results.users.length && !results.posts.length && <EmptyState scope="search" />}
  </>}</>;
}

function ProfilePage() {
  const { username } = useParams();
  const { user, notify } = useApp();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api(`/api/v1/profiles/${encodeURIComponent(username)}/`)
      .then((data) => active && setProfile(data))
      .catch((error) => active && notify(error.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [username]);

  async function toggleFollow() {
    setBusy(true);
    try {
      const result = await api(`/api/v1/profiles/${encodeURIComponent(username)}/follow/`, { method: "POST", body: {} });
      setProfile((current) => ({ ...current, is_following: result.is_following, followers_count: result.followers_count }));
    } catch (error) { notify(error.message); }
    finally { setBusy(false); }
  }

  if (loading) return <PostSkeletons />;
  if (!profile) return <EmptyState scope="profile" />;
  return <>
    <PageHeading eyebrow="A PERSON, NOT A PROFILE" title={`@${profile.user.username}`} />
    <section className="profile-banner"><div className="profile-cover"><span>✳</span><span>CONNECTLY / MEMBER</span></div><div className="profile-main"><Avatar user={{ username: profile.user.username, avatar: profile.user.avatar }} size="large" /><div className="profile-details"><h2>@{profile.user.username}</h2><p>{profile.user.bio || "Making room for the good stuff."}</p><div className="profile-stats"><span><strong>{profile.posts.length}</strong> posts</span><span><strong>{profile.followers_count}</strong> followers</span><span><strong>{profile.following_count}</strong> following</span></div></div><div className="profile-action">{profile.is_self ? <Link className="button button-outline" to="/settings/profile"><Settings2 size={16} /> Edit profile</Link> : <button className={`button ${profile.is_following ? "button-outline" : "button-primary"}`} onClick={toggleFollow} disabled={busy}>{profile.is_following ? <Check size={16} /> : <UsersRound size={16} />}{profile.is_following ? "Following" : "Follow"}</button>}</div></div></section>
    <div className="profile-post-heading"><h2>Posts</h2><span>{profile.posts.length} shared</span></div>
    {profile.posts.length ? <div className="post-list">{profile.posts.map((post) => <PostCard key={post.id} post={post} onDeleted={() => setProfile((current) => ({ ...current, posts: current.posts.filter((item) => item.id !== post.id) }))} />)}</div> : <EmptyState scope="profile-posts" />}
    {user.username === username && <span className="sr-only">This is your profile.</span>}
  </>;
}

function EditProfilePage() {
  const { user, setUser, notify } = useApp();
  const [bio, setBio] = useState(user.bio || "");
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user.avatar || "");
  const [busy, setBusy] = useState(false);
  const fileInput = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!avatar) return undefined;
    const objectUrl = URL.createObjectURL(avatar);
    setAvatarPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [avatar]);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    const form = new FormData();
    form.append("bio", bio);
    if (avatar) form.append("avatar", avatar);
    try {
      const updated = await api("/api/v1/profile/", { method: "POST", body: form });
      setUser(updated);
      notify("Profile updated.");
      navigate(`/u/${updated.username}`);
    } catch (error) { notify(error.message); }
    finally { setBusy(false); }
  }

  return <><PageHeading eyebrow="THE DETAILS THAT FEEL LIKE YOU" title="Edit profile" description="Keep it simple. Keep it yours." /><form className="edit-profile-form" onSubmit={submit}>
    <div className="avatar-editor"><button type="button" className="avatar-edit-button" onClick={() => fileInput.current?.click()}><Avatar user={{ username: user.username, avatar: avatarPreview }} size="large" /><span><Camera size={15} /></span></button><div><strong>Your photo</strong><small>Square images work best.</small><button className="text-button" type="button" onClick={() => fileInput.current?.click()}>Choose a photo</button><input ref={fileInput} className="sr-only" type="file" accept="image/*" onChange={(event) => setAvatar(event.target.files[0] || null)} /></div></div>
    <label className="field-label">Username<input className="field-input" value={user.username} disabled /></label><label className="field-label">Bio<textarea className="field-input bio-input" maxLength={300} value={bio} onChange={(event) => setBio(event.target.value)} placeholder="A sentence that sounds like you." /><small className="field-hint">{bio.length}/300</small></label>
    <div className="form-actions"><Link className="button button-quiet" to={`/u/${user.username}`}>Cancel</Link><button className="button button-primary" disabled={busy}>{busy ? "Saving…" : "Save changes"}<Check size={16} /></button></div>
  </form></>;
}

function EmptyState({ scope }) {
  const content = {
    feed: ["A little quiet here.", "Follow a few people or share the first moment.", "/explore", "Find people"],
    explore: ["Nothing new just yet.", "Check back after the next post lands.", "/", "Back to your feed"],
    search: ["No matches this time.", "Try another name or a different word.", "/explore", "Explore posts"],
    profile: ["We couldn't find that profile.", "It may have moved or no longer exists.", "/", "Go to your feed"],
    "profile-posts": ["Nothing shared yet.", "Their next moment will show up here.", "/explore", "Explore"],
  }[scope];
  return <div className="empty-state"><span className="empty-mark"><Sparkles size={20} /></span><h2>{content[0]}</h2><p>{content[1]}</p><Link className="button button-outline" to={content[2]}>{content[3]}<ArrowRight size={15} /></Link></div>;
}

function PostSkeletons() {
  return <div className="post-list" aria-label="Loading posts">{[0, 1].map((item) => <div className="post-skeleton" key={item}><span /><i /><i /><i /></div>)}</div>;
}

function NotFound() {
  return <EmptyState scope="profile" />;
}

function timeAgo(value) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}