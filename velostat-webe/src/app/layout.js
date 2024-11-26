import "./globals.css";

// Meta bilgilerini projenizin konusuna uygun şekilde düzenleyin
export const metadata = {
  title: "Basınca Duyarlı Koltuk Projesi",
  description: "İstanbul Gelişim Üniversitesi tarafından geliştirilen basınca duyarlı koltuk projesi",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
