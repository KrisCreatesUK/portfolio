export default function ProjectTree({ projects, onSelect }) {
  return (
    <div className="sidebar">
      <div className="sidebar-header">~/projects</div>

      {projects.map((p) => (
        <div
          key={p.id}
          className="sidebar-item"
          onClick={() => onSelect(p)}
        >
          {p.title.rendered}
        </div>
      ))}
    </div>
  );
}