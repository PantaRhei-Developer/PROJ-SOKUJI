import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Info } from 'lucide-react';
import SetupWizardLayout from './SetupWizardLayout';
import FormSelect from '../../components/common/FormSelect';
import Tooltip from '../../components/common/Tooltip';
import { useOnboarding } from '../../context/OnboardingContext';
import './DevicesStep.scss';

interface DeviceOption {
  id: string;
  label: string;
}

const DEFAULT_MIC: DeviceOption[] = [{ id: '', label: 'デフォルトのマイク' }];
const DEFAULT_SPEAKER: DeviceOption[] = [{ id: '', label: 'デフォルトのスピーカー' }];

function DevicesStep() {
  const navigate = useNavigate();
  const { microphoneId, setMicrophone, speakerId, setSpeaker } = useOnboarding();
  const [microphones, setMicrophones] = useState<DeviceOption[]>(DEFAULT_MIC);
  const [speakers, setSpeakers] = useState<DeviceOption[]>(DEFAULT_SPEAKER);

  useEffect(() => {
    navigator.mediaDevices
      ?.enumerateDevices()
      .then((devices) => {
        const mics = devices
          .filter((d) => d.kind === 'audioinput')
          .map((d) => ({ id: d.deviceId, label: d.label || 'マイク' }));
        const speakerDevices = devices
          .filter((d) => d.kind === 'audiooutput')
          .map((d) => ({ id: d.deviceId, label: d.label || 'スピーカー' }));

        setMicrophones(mics.length > 0 ? mics : DEFAULT_MIC);
        setSpeakers(speakerDevices.length > 0 ? speakerDevices : DEFAULT_SPEAKER);
      })
      .catch(() => {
        setMicrophones(DEFAULT_MIC);
        setSpeakers(DEFAULT_SPEAKER);
      });
  }, []);

  return (
    <SetupWizardLayout
      currentStep={1}
      backTo="/setup/language"
      onNext={() => navigate('/setup/confirm')}
      nextLabel="次へ"
    >
      <FormSelect
        label="マイク"
        value={microphoneId}
        onChange={(e) => {
          const selected = microphones.find((m) => m.id === e.target.value);
          setMicrophone(e.target.value, selected?.label ?? 'デフォルトのマイク');
        }}
      >
        {microphones.map((m) => (
          <option key={m.id} value={m.id}>
            {m.label}
          </option>
        ))}
      </FormSelect>

      <FormSelect
        label="スピーカー"
        value={speakerId}
        onChange={(e) => {
          const selected = speakers.find((s) => s.id === e.target.value);
          setSpeaker(e.target.value, selected?.label ?? 'デフォルトのスピーカー');
        }}
      >
        {speakers.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </FormSelect>

      <div className="devices-step__hint">
        <Tooltip content="仮想マイクを使うと、Zoom・Google Meet・Microsoft Teamsが翻訳音声をあなたの実際のマイクからの声として認識します。">
          <Info size={14} />
        </Tooltip>
        <span>ビデオ通話アプリで使いますか？SOKUJI Alloの翻訳音声を仮想マイク経由で流すと、相手にも聞こえます。</span>
      </div>
    </SetupWizardLayout>
  );
}

export default DevicesStep;
