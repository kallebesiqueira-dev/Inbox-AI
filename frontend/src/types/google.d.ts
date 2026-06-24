interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleIdConfig {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
}

interface GoogleButtonOptions {
  theme?: string;
  size?: string;
  width?: number;
  text?: string;
  locale?: string;
}

interface GoogleCodeResponse {
  code: string;
}

interface GoogleCodeClientConfig {
  client_id: string;
  scope: string;
  ux_mode?: "popup" | "redirect";
  callback: (response: GoogleCodeResponse) => void;
}

interface GoogleCodeClient {
  requestCode: () => void;
}

interface Window {
  google?: {
    accounts: {
      id: {
        initialize: (config: GoogleIdConfig) => void;
        renderButton: (parent: HTMLElement, options: GoogleButtonOptions) => void;
      };
      oauth2: {
        initCodeClient: (config: GoogleCodeClientConfig) => GoogleCodeClient;
      };
    };
  };
}
