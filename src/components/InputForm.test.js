import React from 'react';
import {render, screen} from '@testing-library/react';
import InputForm from './InputForm';
test('InputForm renders its trigger child', () => {
  render(
    <InputForm>
      <button>Go</button>
    </InputForm>,
  );
  expect(screen.getByText('Go')).toBeTruthy();
});
