import * as React from 'react';
import { styled } from '@mui/zero-runtime';
import { Button, bounceAnim } from 'local-ui-lib';
import Slider from './Slider/ZeroSlider';

const ShowCaseDiv = styled('div')({
  [`.${Button}`]: {
    color: '#f94564',
    animation: `${bounceAnim} 1s ease infinite`,
  },
});

const HalfWidth = styled.div({
  marginLeft: 20,
  width: '50%',
  maxHeight: 100,
  padding: 20,
  border: '1px solid #ccc',
});

type AppProps = {
  isRed?: boolean;
};

export function App({ isRed }: AppProps) {
  const [count, setCount] = React.useState(0);
  const [value, setValue] = React.useState(50);
  const [isColorPrimary, setIsColorPrimary] = React.useState(true);
  const [size, setSize] = React.useState('medium');
  const [showMarks, setShowMarks] = React.useState(true);
  const [isTrackInverted, setIsTrackInverted] = React.useState(false);
  const [disabled, setDisabled] = React.useState(false);
  const [isHorizontal, setIsHorizontal] = React.useState(true);

  return (
    <div>
      <ShowCaseDiv>
        <Button>This button&apos;s text color has been overridden.</Button>
      </ShowCaseDiv>
      <Button isRed={count % 2 === 1} onClick={() => setCount(count + 1)}>
        Click Count {count}
      </Button>
      <div>
        <div>
          <label>
            <input
              type="checkbox"
              checked={isColorPrimary}
              onChange={() => setIsColorPrimary(!isColorPrimary)}
            />
            Toggle Color: {isColorPrimary ? 'Primary' : 'Secondary'}
          </label>
        </div>
        <div>
          <label>
            <input
              type="checkbox"
              checked={isTrackInverted}
              onChange={() => setIsTrackInverted(!isTrackInverted)}
            />
            Track type: {isTrackInverted ? 'Inverted' : 'Normal'}
          </label>
        </div>
        <div>
          <label>
            <input
              type="checkbox"
              checked={isHorizontal}
              onChange={() => setIsHorizontal(!isHorizontal)}
            />
            Orientation: {isHorizontal ? 'Horizontal' : 'Vertical'}
          </label>
        </div>
        <div>
          <label>
            <input
              type="checkbox"
              checked={disabled}
              onChange={() => setDisabled(!disabled)}
            />
            Disabled: {disabled ? 'Yes' : 'No'}
          </label>
        </div>
        <div>
          <label>
            <input
              type="checkbox"
              checked={showMarks}
              onChange={() => setShowMarks(!showMarks)}
            />
            Show marks: {showMarks ? 'Yes' : 'No'}
          </label>
        </div>
        <div>
          <label>
            Change Size:
            <select value={size} onChange={(ev) => setSize(ev.target.value)}>
              <option value="small">Small</option>
              <option value="medium">Medium</option>
            </select>
          </label>
        </div>
      </div>
      <div>
        <HalfWidth
          sx={({ theme }) => ({
            color: theme.palette.primary.main,
            fontSize: isRed ? 'h1.fontSize' : 'h2.fontSize',
            ':hover': {
              backgroundColor: ['primary.dark', 'secondary.main'],
              color: {
                sm: 'primary.dark',
                md: 'secondary.main',
              },
            },
          })}
        >
          <Slider
            aria-label="Small steps"
            defaultValue={50}
            step={2}
            marks={showMarks}
            min={0}
            max={100}
            valueLabelDisplay="auto"
            orientation={isHorizontal ? 'horizontal' : 'vertical'}
            size={size as 'small' | 'medium'}
            color={isColorPrimary ? 'primary' : 'secondary'}
            track={isTrackInverted ? 'inverted' : 'normal'}
            disabled={disabled}
            value={value}
            onChange={(ev, val) => setValue(val as number)}
          />
        </HalfWidth>
      </div>
    </div>
  );
}
