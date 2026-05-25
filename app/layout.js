export const metadata = {
  title: "Kayla's Job Tracker",
  description: "AI-powered job search and resume tailoring",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, fontFamily: 'Inter, system-ui, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
