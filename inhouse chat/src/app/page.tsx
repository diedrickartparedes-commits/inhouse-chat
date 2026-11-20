"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type User = { id: string; username: string; isAdmin: boolean };
type Group = { id: string; name: string; description: string; isDefault: boolean; memberCount: number; myStatus: string | null };
type Message = { id: string; text: string; createdAt: string; user: { username: string } };
type RequestItem = { id: string; user: { username: string }; group: { name: string } };

async function api(url: string, method = "GET", body?: unknown) {
  const response = await fetch(url, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selected, setSelected] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const loadGroups = useCallback(async () => {
    try {
      const result = await api("/api/groups");
      setGroups(result.groups);
      setSelected((current) => current || result.groups.find((g: Group) => g.myStatus === "APPROVED")?.id || "");
    } catch { /* signed out */ }
  }, []);
  const loadMessages = useCallback(async () => {
    if (!selected) return;
    try { setMessages((await api(`/api/groups/${selected}/messages`)).messages); } catch { setMessages([]); }
  }, [selected]);
  const loadRequests = useCallback(async () => {
    if (!user?.isAdmin) return;
    try { setRequests((await api("/api/admin/requests")).requests); } catch { setRequests([]); }
  }, [user]);

  useEffect(() => { api("/api/auth/me").then((r) => setUser(r.user)).catch(() => {}); }, []);
  useEffect(() => { if (user) { loadGroups(); loadRequests(); } }, [user, loadGroups, loadRequests]);
  useEffect(() => { loadMessages(); }, [loadMessages]);
  useEffect(() => { if (!user) return; const timer = setInterval(() => { loadMessages(); loadGroups(); loadRequests(); }, 4000); return () => clearInterval(timer); }, [user, loadMessages, loadGroups, loadRequests]);

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setNotice(""); setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      if (mode === "register") {
        const result = await api("/api/auth/register", "POST", { username: form.get("username") });
        setUser(result.user);
        setNotice(`Your temporary password is ${result.temporaryPassword}. Save it now; it will not be shown again.`);
      } else {
        const result = await api("/api/auth/login", "POST", { username: form.get("username"), password: form.get("password") });
        setUser(result.user); setNotice("Welcome back.");
      }
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!selected) return;
    const form = event.currentTarget; const data = new FormData(form); setError("");
    try { await api(`/api/groups/${selected}/messages`, "POST", { text: data.get("text") }); form.reset(); await loadMessages(); }
    catch (e) { setError((e as Error).message); }
  }
  async function logout() { await api("/api/auth/logout", "POST"); setUser(null); setGroups([]); setMessages([]); setRequests([]); setNotice("You’re signed out."); }
  async function join(groupId: string) { try { await api("/api/groups/join", "POST", { groupId }); setNotice("Request sent. An admin will review it."); await loadGroups(); } catch (e) { setError((e as Error).message); } }
  async function decide(membershipId: string, approve: boolean) { try { await api("/api/groups/approve", "POST", { membershipId, approve }); await loadRequests(); await loadGroups(); } catch (e) { setError((e as Error).message); } }
  async function createGroup(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = event.currentTarget; const data = new FormData(form); try { await api("/api/groups", "POST", { name: data.get("name"), description: data.get("description") }); form.reset(); setNotice("Group created."); await loadGroups(); } catch (e) { setError((e as Error).message); } }

  const activeGroup = groups.find((g) => g.id === selected);
  if (!user) return <main className="auth-page"><div className="auth-art"><div className="art-top"><span className="brand-mark">c.</span><span>IN-HOUSE / TEAM SPACE</span></div><div className="art-copy"><span className="eyebrow">A LITTLE CLOSER, EVERY DAY</span><h1>Good work<br />starts with<br /><em>good talk.</em></h1><p>A calm, shared corner for your team to exchange ideas and keep the conversation moving.</p></div><div className="art-foot"><span>PRIVATE BY DESIGN</span><span>01 — COMMONS</span></div><div className="art-orbit orbit-one"/><div className="art-orbit orbit-two"/><div className="art-dot dot-one"/><div className="art-dot dot-two"/></div><section className="auth-panel"><div className="auth-card"><div className="mobile-brand"><span className="brand-mark">c.</span><span>COMMONROOM</span></div><span className="eyebrow muted">YOUR TEAM’S SHARED SPACE</span><h2>{mode === "login" ? "Welcome back" : "Find your people"}</h2><p className="auth-sub">{mode === "login" ? "Sign in to pick up where the conversation left off." : "Choose a username and we’ll make a temporary password for you."}</p>{notice && <div className="notice">{notice}</div>}{error && <div className="alert">{error}</div>}<form onSubmit={submitAuth} className="auth-form"><label>Username<input name="username" autoComplete="username" minLength={3} maxLength={20} required placeholder="e.g. sam_lee" /></label>{mode === "login" && <label>Password<input name="password" type="password" autoComplete="current-password" required placeholder="Your password" /></label>}<button className="primary-button" disabled={busy}>{busy ? "One moment…" : mode === "login" ? "Sign in" : "Create account"}<span>↗</span></button></form><div className="switch-auth">{mode === "login" ? "New to the room?" : "Already have an account?"}<button onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); setNotice(""); }}>{mode === "login" ? "Create an account" : "Sign in"}</button></div><p className="auth-note">No email or phone needed. Keep your password somewhere safe.</p></div><div className="auth-bottom"><span>COMMONROOM · PRIVATE TEAM CHAT</span><span>EST. FOR THE EVERYDAY</span></div></section></main>;

  return <main className="app-shell"><aside className="sidebar"><div className="side-brand"><span className="brand-mark">c.</span><div><b>commonroom</b><small>YOUR TEAM SPACE</small></div><button className="dots-button" aria-label="More options">···</button></div><div className="side-label"><span>YOUR ROOMS</span><span className="tiny-count">{groups.length.toString().padStart(2, "0")}</span></div><nav className="room-list">{groups.map((group) => <button key={group.id} className={`room-link ${selected === group.id ? "selected" : ""}`} disabled={group.myStatus !== "APPROVED"} onClick={() => setSelected(group.id)}><span className="hash">#</span><span className="room-name">{group.name}</span>{group.isDefault && <span className="room-dot"/>}</button>)}</nav><div className="side-divider"/><div className="side-label discover-label">DISCOVER ROOMS</div><div className="discover-list">{groups.filter((g) => !g.isDefault).map((group) => <div className="discover-item" key={group.id}><div className="discover-icon">#</div><div className="discover-info"><b>{group.name}</b><small>{group.memberCount} members · {group.description || "A team room"}</small></div>{group.myStatus === "APPROVED" ? <span className="joined">Joined</span> : group.myStatus === "PENDING" ? <span className="pending">Pending</span> : <button className="join-button" onClick={() => join(group.id)}>Ask to join</button>}</div>)}</div><div className="sidebar-bottom"><div className="avatar">{user.username.slice(0, 1).toUpperCase()}</div><div className="profile-copy"><b>{user.username}{user.isAdmin && <span className="admin-tag">ADMIN</span>}</b><small>{user.isAdmin ? "Workspace admin" : "Team member"}</small></div><button className="logout" onClick={logout} title="Sign out">↗</button></div></aside>
  <section className="main-area"><header className="topbar"><div className="breadcrumb"><span>ROOMS</span><span className="crumb-slash">/</span><b>{activeGroup?.name || "Choose a room"}</b></div><div className="topbar-right"><span className="live-indicator"><i/> All systems online</span><span className="top-avatar">{user.username.slice(0, 1).toUpperCase()}</span></div></header><div className="content-wrap"><div className="room-heading"><div><span className="eyebrow muted">A SHARED ROOM FOR EVERYONE</span><h1><span className="title-hash">#</span>{activeGroup?.name || "Commons"}</h1><p>{activeGroup?.description || "The shared room for everyone. Say hello, share an idea, or jump into the conversation."}</p></div><div className="member-stack"><div className="stack-avatars"><span>A</span><span>M</span><span>J</span><span className="stack-more">+{activeGroup?.memberCount || 1}</span></div><small>{activeGroup?.memberCount || 1} people here</small></div></div>{notice && <div className="notice inline-notice">{notice}<button onClick={() => setNotice("")}>×</button></div>}{error && <div className="alert inline-notice">{error}<button onClick={() => setError("")}>×</button></div>}
  {user.isAdmin && <div className="admin-tools"><div className="admin-head"><span className="admin-icon">✳</span><div><b>Workspace controls</b><small>Manage rooms and membership requests</small></div></div><form className="create-room" onSubmit={createGroup}><input name="name" required minLength={2} maxLength={32} placeholder="New room name"/><input name="description" maxLength={140} placeholder="What’s this room for?"/><button className="small-primary">Create room</button></form>{requests.length > 0 && <div className="requests"><b>Join requests <span>{requests.length}</span></b>{requests.map((r) => <div className="request-row" key={r.id}><span><b>{r.user.username}</b> wants to join <b>#{r.group.name}</b></span><button onClick={() => decide(r.id, true)}>Approve</button><button className="decline" onClick={() => decide(r.id, false)}>Decline</button></div>)}</div>}</div>}
  <div className="messages-label"><span>THE CONVERSATION</span><span>{messages.length} messages</span></div><div className="message-list">{messages.length === 0 ? <div className="empty-state"><div className="empty-bubble">✳</div><b>A fresh page</b><p>No messages here yet. Start the conversation.</p></div> : messages.map((message, i) => <article className="message" key={message.id}><div className={`message-avatar color-${i % 5}`}>{message.user.username.slice(0, 1).toUpperCase()}</div><div className="message-body"><div className="message-meta"><b>{message.user.username}{message.user.username === user.username && <span className="you-tag">YOU</span>}</b><time>{new Date(message.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</time></div><p>{message.text}</p></div></article>)}</div><form className="compose" onSubmit={sendMessage}><span className="compose-plus">＋</span><input name="text" maxLength={2000} placeholder={`Message #${activeGroup?.name || "Commons"}`} required disabled={!activeGroup}/><span className="compose-hint">ENTER TO SEND</span><button className="send-button" aria-label="Send message">↑</button></form><div className="compose-foot"><span>Be kind. Make space for every voice.</span><span>MESSAGES REFRESH AUTOMATICALLY</span></div></div><footer className="app-footer"><span>COMMONROOM <i/> A LITTLE SPACE TO THINK OUT LOUD</span><span>BUILT FOR YOUR TEAM, WITH CARE.</span></footer></section></main>;
}
