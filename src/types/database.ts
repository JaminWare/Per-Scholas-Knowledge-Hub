export interface Contributor {
  id: string;
  name: string;
  cohort_id: string;
  linkedin_url: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

export interface Section {
  id: string;
  title: string;
  slug: string;
  parent_id: string | null;
  order_index: number;
  icon_name: string | null;
  children?: Section[];
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  section_id: string | null;
  content: string;
  excerpt: string | null;
  contributor_id: string | null;
  tags: string[];
  is_featured: boolean;
  is_sample: boolean;
  study_category: string | null;
  source_file: string | null;
  author_name: string | null;
  submission_type?: string | null;
  created_at: string;
  updated_at: string;
  contributor?: Contributor;
  section?: Section;
}

export interface SearchResult {
  type: 'article' | 'section';
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
}
