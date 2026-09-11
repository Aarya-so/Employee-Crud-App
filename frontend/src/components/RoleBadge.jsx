const LABELS = {
  super_admin: "super admin",
  admin: "admin",
  user: "user",
};

export default function RoleBadge({ role }) {
  return <span className={`role-badge role-${role}`}>{LABELS[role] || role}</span>;
}
