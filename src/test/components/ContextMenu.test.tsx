import { createRef } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ContextMenu from '../../components/ContextMenu';
import type { ContextMenuItem } from '../../hooks/useContextMenu';

const items: ContextMenuItem[] = [
  { id: 'open', label: 'Open', icon: <span>icon</span> },
  { id: 'separator', label: '', separator: true },
  { id: 'delete', label: 'Delete', danger: true, disabled: true },
];

describe('ContextMenu', () => {
  it('renders nothing while hidden', () => {
    const { container } = render(
      <ContextMenu visible={false} x={0} y={0} items={items} menuRef={createRef()} onItemClick={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('positions items, renders separators, and invokes enabled actions', () => {
    const onItemClick = vi.fn();
    render(
      <ContextMenu visible={true} x={24} y={48} items={items} menuRef={createRef()} onItemClick={onItemClick} />
    );

    const menu = screen.getByRole('menu');
    expect(menu).toHaveStyle({ left: '24px', top: '48px' });
    expect(screen.getByRole('separator')).toBeDefined();
    expect(screen.getByText('icon')).toBeDefined();

    fireEvent.click(screen.getByRole('menuitem', { name: /Open/ }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Delete' }));

    expect(onItemClick).toHaveBeenCalledTimes(1);
    expect(onItemClick).toHaveBeenCalledWith(items[0]);
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toBeDisabled();
  });
});
