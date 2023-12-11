'use client';
import * as React from 'react';
import clsx from 'clsx';
import { unstable_composeClasses as composeClasses } from '@mui/base/composeClasses';
import { styled } from '@mui/zero-runtime';
import useThemeProps from '@mui/material/styles/useThemeProps';
import useForkRef from '@mui/material/utils/useForkRef';
import useEventCallback from '@mui/material/utils/useEventCallback';
import useIsFocusVisible from '@mui/material/utils/useIsFocusVisible';
import TouchRipple from './TouchRipple';
import buttonBaseClasses, {
  getButtonBaseUtilityClass,
} from './buttonBaseClasses';

const useUtilityClasses = (ownerState) => {
  const { disabled, focusVisible, focusVisibleClassName, classes } = ownerState;

  const slots = {
    root: ['root', disabled && 'disabled', focusVisible && 'focusVisible'],
  };

  const composedClasses = composeClasses(
    slots,
    getButtonBaseUtilityClass,
    classes,
  );

  if (focusVisible && focusVisibleClassName) {
    composedClasses.root += ` ${focusVisibleClassName}`;
  }

  return composedClasses;
};

export const ButtonBaseRoot = styled('button', {
  name: 'MuiButtonBase',
  slot: 'Root',
  overridesResolver: (props, styles) => styles.root,
})({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  boxSizing: 'border-box',
  WebkitTapHighlightColor: 'transparent',
  backgroundColor: 'transparent', // Reset default value
  // We disable the focus ring for mouse, touch and keyboard users.
  outline: 0,
  border: 0,
  margin: 0, // Remove the margin in Safari
  borderRadius: 0,
  padding: 0, // Remove the padding in Firefox
  cursor: 'pointer',
  userSelect: 'none',
  verticalAlign: 'middle',
  MozAppearance: 'none', // Reset
  WebkitAppearance: 'none', // Reset
  textDecoration: 'none',
  // So we take precedent over the style of a native <a /> element.
  color: 'inherit',
  '&::-moz-focus-inner': {
    borderStyle: 'none', // Remove Firefox dotted outline.
  },
  [`&.${buttonBaseClasses.disabled}`]: {
    pointerEvents: 'none', // Disable link interactions
    cursor: 'default',
  },
  '@media print': {
    colorAdjust: 'exact',
  },
});

/**
 * `ButtonBase` contains as few styles as possible.
 * It aims to be a simple building block for creating a button.
 * It contains a load of style reset and some focus/ripple logic.
 */
const ButtonBase = React.forwardRef(function ButtonBase(inProps, ref) {
  const props = useThemeProps({ props: inProps, name: 'MuiButtonBase' });
  const {
    action,
    centerRipple = false,
    children,
    className,
    component = 'button',
    disabled = false,
    disableRipple = false,
    disableTouchRipple = false,
    focusRipple = false,
    LinkComponent = 'a',
    onBlur,
    onClick,
    onContextMenu,
    onDragLeave,
    onFocus,
    onFocusVisible,
    onKeyDown,
    onKeyUp,
    onMouseDown,
    onMouseLeave,
    onMouseUp,
    onTouchEnd,
    onTouchMove,
    onTouchStart,
    tabIndex = 0,
    TouchRippleProps,
    touchRippleRef,
    type,
    ...other
  } = props;

  const buttonRef = React.useRef(null);

  const rippleRef = React.useRef(null);
  const handleRippleRef = useForkRef(rippleRef, touchRippleRef);

  const {
    isFocusVisibleRef,
    onFocus: handleFocusVisible,
    onBlur: handleBlurVisible,
    ref: focusVisibleRef,
  } = useIsFocusVisible();
  const [focusVisible, setFocusVisible] = React.useState(false);
  if (disabled && focusVisible) {
    setFocusVisible(false);
  }

  React.useImperativeHandle(
    action,
    () => ({
      focusVisible: () => {
        setFocusVisible(true);
        buttonRef.current.focus();
      },
    }),
    [],
  );

  const [mountedState, setMountedState] = React.useState(false);

  React.useEffect(() => {
    setMountedState(true);
  }, []);

  const enableTouchRipple = mountedState && !disableRipple && !disabled;

  React.useEffect(() => {
    if (focusVisible && focusRipple && !disableRipple && mountedState) {
      rippleRef.current.pulsate();
    }
  }, [disableRipple, focusRipple, focusVisible, mountedState]);

  function useRippleHandler(
    rippleAction,
    eventCallback,
    skipRippleAction = disableTouchRipple,
  ) {
    return useEventCallback((event) => {
      if (eventCallback) {
        eventCallback(event);
      }

      const ignore = skipRippleAction;
      if (!ignore && rippleRef.current) {
        rippleRef.current[rippleAction](event);
      }

      return true;
    });
  }

  const handleMouseDown = useRippleHandler('start', onMouseDown);
  const handleContextMenu = useRippleHandler('stop', onContextMenu);
  const handleDragLeave = useRippleHandler('stop', onDragLeave);
  const handleMouseUp = useRippleHandler('stop', onMouseUp);
  const handleMouseLeave = useRippleHandler('stop', (event) => {
    if (focusVisible) {
      event.preventDefault();
    }
    if (onMouseLeave) {
      onMouseLeave(event);
    }
  });
  const handleTouchStart = useRippleHandler('start', onTouchStart);
  const handleTouchEnd = useRippleHandler('stop', onTouchEnd);
  const handleTouchMove = useRippleHandler('stop', onTouchMove);

  const handleBlur = useRippleHandler(
    'stop',
    (event) => {
      handleBlurVisible(event);
      if (isFocusVisibleRef.current === false) {
        setFocusVisible(false);
      }
      if (onBlur) {
        onBlur(event);
      }
    },
    false,
  );

  const handleFocus = useEventCallback((event) => {
    // Fix for https://github.com/facebook/react/issues/7769
    if (!buttonRef.current) {
      buttonRef.current = event.currentTarget;
    }

    handleFocusVisible(event);
    if (isFocusVisibleRef.current === true) {
      setFocusVisible(true);

      if (onFocusVisible) {
        onFocusVisible(event);
      }
    }

    if (onFocus) {
      onFocus(event);
    }
  });

  const isNonNativeButton = () => {
    const button = buttonRef.current;
    return (
      component &&
      component !== 'button' &&
      !(button.tagName === 'A' && button.href)
    );
  };

  /**
   * IE11 shim for https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/repeat
   */
  const keydownRef = React.useRef(false);
  const handleKeyDown = useEventCallback((event) => {
    // Check if key is already down to avoid repeats being counted as multiple activations
    if (
      focusRipple &&
      !keydownRef.current &&
      focusVisible &&
      rippleRef.current &&
      event.key === ' '
    ) {
      keydownRef.current = true;
      rippleRef.current.stop(event, () => {
        rippleRef.current.start(event);
      });
    }

    if (
      event.target === event.currentTarget &&
      isNonNativeButton() &&
      event.key === ' '
    ) {
      event.preventDefault();
    }

    if (onKeyDown) {
      onKeyDown(event);
    }

    // Keyboard accessibility for non interactive elements
    if (
      event.target === event.currentTarget &&
      isNonNativeButton() &&
      event.key === 'Enter' &&
      !disabled
    ) {
      event.preventDefault();
      if (onClick) {
        onClick(event);
      }
    }
  });

  const handleKeyUp = useEventCallback((event) => {
    // calling preventDefault in keyUp on a <button> will not dispatch a click event if Space is pressed
    // https://codesandbox.io/s/button-keyup-preventdefault-dn7f0
    if (
      focusRipple &&
      event.key === ' ' &&
      rippleRef.current &&
      focusVisible &&
      !event.defaultPrevented
    ) {
      keydownRef.current = false;
      rippleRef.current.stop(event, () => {
        rippleRef.current.pulsate(event);
      });
    }
    if (onKeyUp) {
      onKeyUp(event);
    }

    // Keyboard accessibility for non interactive elements
    if (
      onClick &&
      event.target === event.currentTarget &&
      isNonNativeButton() &&
      event.key === ' ' &&
      !event.defaultPrevented
    ) {
      onClick(event);
    }
  });

  let ComponentProp = component;

  if (ComponentProp === 'button' && (other.href || other.to)) {
    ComponentProp = LinkComponent;
  }

  const buttonProps = {};
  if (ComponentProp === 'button') {
    buttonProps.type = type === undefined ? 'button' : type;
    buttonProps.disabled = disabled;
  } else {
    if (!other.href && !other.to) {
      buttonProps.role = 'button';
    }
    if (disabled) {
      buttonProps['aria-disabled'] = disabled;
    }
  }

  const handleRef = useForkRef(ref, focusVisibleRef, buttonRef);

  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    React.useEffect(() => {
      if (enableTouchRipple && !rippleRef.current) {
        console.error(
          [
            'MUI: The `component` prop provided to ButtonBase is invalid.',
            'Please make sure the children prop is rendered in this custom component.',
          ].join('\n'),
        );
      }
    }, [enableTouchRipple]);
  }

  const ownerState = {
    ...props,
    centerRipple,
    component,
    disabled,
    disableRipple,
    disableTouchRipple,
    focusRipple,
    tabIndex,
    focusVisible,
  };

  const classes = useUtilityClasses(ownerState);

  return (
    <ButtonBaseRoot
      as={ComponentProp}
      className={clsx(classes.root, className)}
      ownerState={ownerState}
      onBlur={handleBlur}
      onClick={onClick}
      onContextMenu={handleContextMenu}
      onFocus={handleFocus}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onMouseDown={handleMouseDown}
      onMouseLeave={handleMouseLeave}
      onMouseUp={handleMouseUp}
      onDragLeave={handleDragLeave}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onTouchStart={handleTouchStart}
      ref={handleRef}
      tabIndex={disabled ? -1 : tabIndex}
      type={type}
      {...buttonProps}
      {...other}
    >
      {children}
      {enableTouchRipple ? (
        /* TouchRipple is only needed client-side, x2 boost on the server. */
        <TouchRipple
          ref={handleRippleRef}
          center={centerRipple}
          {...TouchRippleProps}
        />
      ) : null}
    </ButtonBaseRoot>
  );
});

export default ButtonBase;
