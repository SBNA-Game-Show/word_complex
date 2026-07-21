export default function UserBadge({ user, onLogout }) {
  const initials = (user?.nickname ?? user?.name ?? "P")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="user-badge" data-testid="user-badge">
      <div className="user-avatar" aria-hidden="true">
        {initials}
      </div>

      <div className="user-badge-copy">
        <span data-testid="user-badge-name">{user?.nickname ?? "Player"}</span>

        <small data-testid="user-badge-role">{user?.role ?? "Reader"}</small>
      </div>

      <button
        className="logout-button"
        data-testid="logout-button"
        type="button"
        onClick={onLogout}
      >
        Log out
      </button>
    </div>
  );
}
