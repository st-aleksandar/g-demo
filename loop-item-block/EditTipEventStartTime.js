import {InspectorControls, InspectorAdvancedControls, useBlockProps} from '@wordpress/block-editor';
import {PanelBody, Button, ButtonGroup, TextControl} from '@wordpress/components';
import {useEffect} from "@wordpress/element";

function EditTipEventStartTime({attributes, setAttributes, context}) {
  const persistentClasses = 'bc-tips-event__time';
  const defaultClasses = 'align-self-start order-1 order-md-0 mx-0 mx-md-2 mb-2 p-1 rounded-4 bg-light d-flex flex-md-column align-items-center';

  useEffect(() => {
    if (!attributes.initializeBlock) {
      attributes.className = defaultClasses;
      setAttributes({initializeBlock: true});
    }
  }, []);

  useEffect(() => {
    if (!attributes.initializeBlock) {
      const timeClasses = attributes.timeType === 'time'
        ? `fw-bold mb-md-2 me-2 me-md-0 lh-sm`
        : `lh-1 py-1 px-2 fs-5 bg-white rounded-2`

      setAttributes({timeClasses});
    }
  }, [attributes.timeType]);

  const blockPropsContainer = useBlockProps({
    className: `bc-tips-gutenberg ${persistentClasses} ${attributes.className}`
  });
  const blockProps = useBlockProps({
    className: attributes.timeType === 'time' ? attributes.timeClasses : attributes.dateClasses
  });
  const startTime = context.event
    ? attributes.timeType === 'time'
      ? context.event.startTime
      : context.event.startDate
    : null;

  return (
    <>
      <InspectorControls>
        <PanelBody title="Settings">
          <ButtonGroup>
            <Button
              isPrimary={attributes.timeType === 'time'}
              onClick={() => {
                setAttributes({
                  timeType: 'time',
                })
              }}>Hour</Button>
            <Button
              isPrimary={attributes.timeType === 'date'}
              onClick={() => {
                setAttributes({
                  timeType: 'date',
                })
              }}>Date</Button>
          </ButtonGroup>
        </PanelBody>
      </InspectorControls>
      <InspectorAdvancedControls>
        { attributes.timeType === 'date' ?
          <TextControl
            label="Additional CSS class(es) for Date span, use the field below to edit div container class(es)"
            value={attributes.dateClasses}
            onChange={dateClasses => setAttributes({dateClasses})}
            help="Separate multiple classes with spaces."/>
          :
          <TextControl
            label="Additional CSS class(es) for Time span, use the field below to edit div container class(es)"
            value={attributes.timeClasses}
            onChange={timeClasses => setAttributes({timeClasses})}
            help="Separate multiple classes with spaces."/>
        }

      </InspectorAdvancedControls>
      {startTime ?
        <div {...blockPropsContainer}>
          <span {...blockProps}>
            {startTime}
          </span>
        </div>
        : <span {...blockProps}>This block must be used inside one of Tip Loop blocks</span>
      }
    </>
  );
}

export default EditTipEventStartTime;
