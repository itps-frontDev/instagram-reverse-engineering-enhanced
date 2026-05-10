export type Session = {
  user: {
    id: string;
    email: string | null;
    phoneNumber?: string | null;
    username?: string | null;
  };
};
