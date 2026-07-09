import { useNavigate } from 'react-router-dom';
import './BackLink.scss';

interface BackLinkProps {
  to: string;
  label?: string;
}

function BackLink({ to, label = '← 戻る' }: BackLinkProps) {
  const navigate = useNavigate();

  return (
    <button type="button" className="back-link" onClick={() => navigate(to)}>
      {label}
    </button>
  );
}

export default BackLink;
