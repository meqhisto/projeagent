import { render, screen } from '@testing-library/react';
import ParcelCard from '@/components/ParcelCard';
import { vi } from 'vitest';
import { ReactNode } from 'react';

// Mock useRouter
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: vi.fn(),
    push: vi.fn(),
  }),
}));

// Mock Link
vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, className, ...props }: { children: ReactNode; href: string; className?: string; [key: string]: unknown }) => (
    <a href={href} className={className} {...props}>{children}</a>
  ),
}));

describe('ParcelCard Accessibility', () => {
  const defaultProps = {
    id: 1,
    city: 'Istanbul',
    district: 'Kadikoy',
    island: 101,
    parcel: 5,
    status: 'PENDING' as const,
    category: 'RESIDENTIAL',
  };

  it('renders action buttons with accessible labels', () => {
    render(<ParcelCard {...defaultProps} />);

    // Check for aria-labels
    expect(screen.getByLabelText('Hızlı Bakış')).toBeInTheDocument();
    expect(screen.getByLabelText('Düzenle')).toBeInTheDocument();
    expect(screen.getByLabelText('Sil')).toBeInTheDocument();

    // Check for titles
    expect(screen.getByTitle('Hızlı Bakış')).toBeInTheDocument();
    expect(screen.getByTitle('Düzenle')).toBeInTheDocument();
    expect(screen.getByTitle('Sil')).toBeInTheDocument();
  });

  it('action buttons have focus visible styles', () => {
     render(<ParcelCard {...defaultProps} />);
     const quickViewBtn = screen.getByLabelText('Hızlı Bakış');
     expect(quickViewBtn).toHaveClass('focus-visible:ring-2');
  });
});
