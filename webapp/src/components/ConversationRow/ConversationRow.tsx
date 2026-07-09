import { User } from 'lucide-react';
import './ConversationRow.scss';

interface ConversationRowProps {
  lang: string;
  text: string;
  isTranslation: boolean;
  time: string;
}

// Visual-only replica of src/components/MainPanel/ConversationRow.tsx for this
// static placeholder screen — the real component depends on the sessionStore,
// i18next, and karaoke playback state that don't exist in this standalone app yet.
function ConversationRow({ lang, text, isTranslation, time }: ConversationRowProps) {
  return (
    <div className="conversation-row source-speaker with-header expanded">
      <div className="row-header">
        <div className="row-avatar avatar-speaker">
          <User size={12} />
        </div>
        <div className="row-name">
          <span className="row-name-text">Speaker</span>
          <span className="row-time">{time}</span>
        </div>
      </div>
      <div className="row-body">
        <span className={`lang-badge ${isTranslation ? 'tr' : 'src'} source-speaker`}>{lang}</span>
        <span className={`row-text ${isTranslation ? 'tr' : 'src'}`}>{text}</span>
      </div>
    </div>
  );
}

export default ConversationRow;
