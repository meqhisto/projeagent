import { render, screen } from '@testing-library/react';
import PropertyCard from '@/components/PropertyCard';
import { vi } from 'vitest';
import { ReactNode } from 'react';

// Mock Link
vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, className, ...props }: { children: ReactNode; href: string; className?: string; [key: string]: any }) => (
    <a href={href} className={className} {...props}>{children}</a>
  ),
}));

describe('PropertyCard Accessibility', () => {
  const defaultProps = {
    property: {
      id: 1,
      title: 'Test Property',
      type: 'APARTMENT',
      status: 'AVAILABLE',
      city: 'Istanbul',
      district: 'Sisli',
      neighborhood: 'Fulya',
      images: [],
    },
    onEdit: vi.fn(),
    onDelete: vi.fn(),
  };

  it('renders action buttons with accessible labels', () => {
    render(<PropertyCard {...defaultProps} />);

    // Check for aria-labels
    expect(screen.getByLabelText('Detayları Görüntüle')).toBeInTheDocument();
    expect(screen.getByLabelText('Düzenle')).toBeInTheDocument();
    expect(screen.getByLabelText('Sil')).toBeInTheDocument();

    // Check for titles
    expect(screen.getByTitle('Detayları Görüntüle')).toBeInTheDocument();
    expect(screen.getByTitle('Düzenle')).toBeInTheDocument();
    expect(screen.getByTitle('Sil')).toBeInTheDocument();
  });
});
