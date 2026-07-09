import type { ButtonHTMLAttributes } from 'react';
import './PrimaryButton.scss';

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  fullWidth?: boolean;
}

function PrimaryButton({ fullWidth, className, ...rest }: PrimaryButtonProps) {
  const classes = ['primary-button', fullWidth && 'primary-button--full', className]
    .filter(Boolean)
    .join(' ');

  return <button className={classes} {...rest} />;
}

export default PrimaryButton;
