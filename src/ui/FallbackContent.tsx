import { profile } from '../content/profile'
import { projects } from '../content/projects'
import ProjectCard from './ProjectCard'

export default function FallbackContent() {
  return (
    <div className="fallback">
      <header>
        <h1>{profile.name}</h1>
        <p className="subtitle">{profile.tagline ?? '个人定位待填写'}</p>
        <p className="about">{profile.about}</p>
      </header>

      <section className="fallback-section">
        <h2>项目</h2>
        <div className="project-list">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      </section>

      <section className="fallback-section">
        <h2>联系</h2>
        <ul className="contact-list">
          <li>邮箱：{profile.email ?? '待填写'}</li>
          {profile.socials.map((s) => (
            <li key={s.label}>
              {s.label}：
              {s.url ? (
                <a href={s.url} target="_blank" rel="noopener noreferrer">
                  {s.url}
                </a>
              ) : (
                '待填写'
              )}
            </li>
          ))}
          <li>简历：{profile.resumeUrl ?? '待填写'}</li>
        </ul>
      </section>
    </div>
  )
}
