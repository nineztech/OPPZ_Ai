interface Chrome {
  runtime: {
    sendMessage: (message: {
      action: string;
      data: {
        isAuthenticated: boolean;
        user: {
          id: string;
          fullName: string;
          email: string;
          createdAt: string;
        };
      };
    }) => void;
  };
}

declare global {
  interface Window {
    chrome?: Chrome;
  }
}

export {}; 