import { NavSegmentLink } from '../atoms';

export interface AuthModeSwitcherProps {
  activeMode: 'login' | 'register';
}

export function AuthModeSwitcher({ activeMode }: AuthModeSwitcherProps) {
  return (
    <nav aria-label="Modo de acceso" className="cf-switcher">
      <NavSegmentLink href="/login" active={activeMode === 'login'}>
        Iniciar sesión
      </NavSegmentLink>
      <NavSegmentLink href="/register" active={activeMode === 'register'}>
        Crear cuenta
      </NavSegmentLink>
    </nav>
  );
}

