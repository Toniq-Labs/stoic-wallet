import React from 'react';
import {render, screen, fireEvent} from '@testing-library/react';
import NFTCard from './NFTCard';
test('NFTCard renders title and forwards clicks', () => {
  const onClick = jest.fn();
  render(<NFTCard title="Cronics" count={3} onClick={onClick} />);
  expect(screen.getByText('Cronics')).toBeTruthy();
  fireEvent.click(screen.getByText('Cronics'));
  expect(onClick).toHaveBeenCalled();
});
