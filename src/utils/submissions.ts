export interface NewSubmission {
  id: string;
  full_name: string;
  track: string;
  badge: string;
  title: string;
  content: string;
  submission_type?: string;
  media_link?: string;
  comp_objective?: string;
  created_at: string;
}
