import { useLocation } from './lib/router.jsx';
import { DocsProvider } from './lib/docs-context.jsx';
import DocsLayout from './pages/DocsLayout.jsx';

export default function App() {
  const location = useLocation();
  return (
    <DocsProvider>
      <DocsLayout location={location} />
    </DocsProvider>
  );
}
