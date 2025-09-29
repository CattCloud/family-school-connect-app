import logo from '../../assets/logo.png'
import { PulseLoader } from 'react-spinners'

export default function SplashScreen({ label = 'Cargando...' }) {
  const primaryColor = "#5D3FD3"

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-bg-app">
      <div className="flex flex-col items-center gap-8">
        <img
          src={logo}
          alt="I.E.P. Las Orquídeas"
          className="h-32 w-auto select-none"
          draggable={false}
        />

        <PulseLoader 
          color={primaryColor}
          size={12}
          margin={4}
        />

        {label && (
          <div className="text-base text-text-secondary font-medium mt-4">
            {label}
          </div>
        )}
      </div>
    </div>
  )
}