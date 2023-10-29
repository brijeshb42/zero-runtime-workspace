import '@mui/zero-runtime/styles.css';

import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { styled } from '@mui/zero-runtime';
import { Button, bounceAnim } from 'local-ui-lib';

const LocalButton = styled.button<{ isRed?: boolean }>({
  color: ({ isRed }) => (isRed ? 'primary.main' : 'secondary.main'),
  background: 'transparent',
  borderRadius: 5,
  animation: `${bounceAnim} 1s ease-in infinite`,
});

const root = createRoot(document.getElementById('root') as HTMLElement);

function App() {
  const [count, setCount] = useState(0);
  return (
    <>
      <LocalButton type="button" isRed={count % 2 === 0}>
        Local Button
      </LocalButton>
      <Button
        type="button"
        onClick={() => {
          setCount(count + 1);
        }}
      >
        Library Button
      </Button>
    </>
  );
}

root.render(<App />);
