export default function UserBadge({ user, onLogout }) {
  const initials = (user?.nickname ?? user?.name ?? "P")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="user-badge">
      <div className="user-avatar" aria-hidden="true">{initials}</div>
      <div className="user-badge-copy">
        <span>{user?.nickname ?? "Player"}</span>
        <small>{user?.role ?? "Reader"}</small>
      </div>
      <button className="logout-button" type="button" onClick={onLogout}>
        Log out
      </button>
    </div>
  );
}
