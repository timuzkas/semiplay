import { cn } from '@/lib/utils';

interface Service {
  id: 'spotify' | 'youtube';
  name: string;
  icon: React.ReactNode;
  connected: boolean;
}

interface ServiceSelectorProps {
  services: Service[];
  activeService: string | null;
  onSelect: (serviceId: 'spotify' | 'youtube') => void;
  className?: string;
}

export function ServiceSelector({
  services,
  activeService,
  onSelect,
  className,
}: ServiceSelectorProps) {
  return (
    <div className={cn('flex items-center gap-1 p-1 bg-secondary/50 rounded-lg', className)}>
      {services.map((service) => (
        <button
          key={service.id}
          onClick={() => onSelect(service.id)}
          disabled={!service.connected}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200',
            activeService === service.id
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
            !service.connected && 'opacity-50 cursor-not-allowed'
          )}
        >
          {service.icon}
          <span className="hidden sm:inline">{service.name}</span>
        </button>
      ))}
    </div>
  );
}
