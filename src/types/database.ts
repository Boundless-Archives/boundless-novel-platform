export type ContinueReading = {
    chapter_id: string;
  
    stories: {
      title: string;
      slug: string;
      cover_url: string | null;
    };
  
    chapters: {
      title: string;
      chapter_number: number;
    };
  };