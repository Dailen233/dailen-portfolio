export interface Project {
  id: string
  name: string
  status: string
  summary: string
  demoUrl: string | null
  sourceUrl: string | null
  myWork: string | null
  stack: string[] | null
  cover: string | null
}

export interface SocialLink {
  label: string
  url: string | null
}

export interface Profile {
  name: string
  tagline: string | null
  about: string
  email: string | null
  resumeUrl: string | null
  socials: SocialLink[]
}
