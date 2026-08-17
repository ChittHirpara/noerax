const fs = require('fs');

// 1. AuthPage.tsx
let auth = fs.readFileSync('src/components/layout/AuthPage.tsx', 'utf8');
auth = auth.replace(
  /useEffect\(\(\) => \{\r\n\s*if \(user\) \{\r\n\s*window+location\.href = ['"]\/chat['"];\r\n\s*}\r\n\s*}\, \[user\]\);/s,
  `useEffect(() => {
    if (user) {
      const params = new URLSearchParams(window.location.search);
      const target = params.get('redirect') || '/';
      window.location.href = target;
    }
  }, [user]);`
);
auth = auth.replace(
  "window.location.href = '/chat';",
  `const target = params.get('redirect') || '/';\n            window.location.href = target;`
);
auth = auth.replace(
  "window.location.href = '/api/auth/google';",
  `const params = new URLSearchParams(window.location.search);\n    const redirect = params.get('redirect');\n    window.location.href = '/api/auth/google' + (redirect ? '?redirect=' + encodeURIComponent(redirect) : '');`
);
auth = auth.replace(
  `if (!res.success && res.error) {\n      setError(res.error);\n    }\n    // On success, AuthContext itself redirects to /chat`,
  `if (res.success) {
      const params = new URLSearchParams(window.location.search);
      const target = params.get('redirect') || '/';
      window.location.href = target;
    } else if (res.error) {
      setError(res.error);
    }`
);
auth = auth.replace(
  `setIsLoading(false);\n                    // AuthContext handles redirect on success`,
  `setIsLoading(false);\n                    if (res.success) {\n                      const params = new URLSearchParams(window.location.search);\n                      const target = params.get('redirect') || '/';
                      window.location.href = target;\n                    }`
);
fs.writeFileSync('src/components/layout/AuthPage.tsx', auth, 'utf8');
console.log('AuthPage updated');

// 2. Hero.tsx
let hero = fs.readFileSync('src/components/sections/Hero.tsx', 'utf8');
hero = hero.replace(
  "onClick={() => navigate(user ? '/chat' : '/auth')}",
  `onClick={() => {\n                const el = document.getElementById('library') || document.getElementById('guides') || document.getElementById('struggles');\n                if (el) {\n                  el.scrollIntoView(; behavior: 'smooth' });\n                } else {\n                  navigate('/#library');\n                }\n              }}`
);
fs.writeFileSync('src/components/sections/Hero.tsx', hero, 'utf8');
console.log('Hero updated');

// 3. Navbar.tsx
let nav = fs.readFileSync('src/components/layout/Navbar.tsx', 'utf8');
nav = nav.replace(
  `onSlick={() => navigate(user ? '/chat' : '/auth')\r\n              className="btn-liquid-primary !px-5 !py-2 !text-sm\"\r\n            >\r\n              Start Learning`,
  `onClick={() => navigate('/auth')\r\n              className=\"btn-liquid-primary !px-5 !py-2 !text-sm\"\r\n            >\r\n              Sign In`
[;
if (!nav.includes("{ label: 'Chat'")) {
  nav = nav.replace(
    "{ label: 'Home', path: '/' },",
    "{ label: 'Home', path: '/' },\r\n    { label: 'Chat', path: '/chat' },"
  );
}
fs.writeFileSync('src/components/layout/Navbar.tsx', nav, 'utf8');
console.log('Navbar updated');

// 4. ChatPreview.tsx
let cp = fs.readFileSync('src/components/sections/ChatPreview.tsx', 'utf8');
cp = cp.replace(
  "onClick={() => navigate(user ? '/chat' : '/auth')}",
  "onClick={() => navigate(user ? '/chat' : '/auth?redirect=/chat')}"
);
fs.writeFileSync('src/components/sections/ChatPreview.tsx', cp, 'utf8');
console.log('ChatPreview updated');
