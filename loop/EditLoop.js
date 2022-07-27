import { PanelBody, SelectControl, Spinner, TextControl, ToggleControl } from '@wordpress/components';
import {
  InspectorControls,
  InspectorAdvancedControls,
  BlockContextProvider,
  useBlockProps,
  BlockPreview,
  useInnerBlocksProps,
  store as blockEditorStore
} from '@wordpress/block-editor';
import { useEffect, useState, useMemo } from "@wordpress/element";
import { useSelect } from '@wordpress/data';

const TEMPLATE = [
  [ 'bc-tips/tip-container', {}, [
    ['bc-tips/tip-event-title']
  ]]
];

import getTipList from "../../../utils/getTipList";
import getListSortByOptions from "../../../utils/getListSortByOptions";
import getStatusOptions from "../../../utils/getStatusOptions";
import getTipsterTypeOptions from "../../../utils/getTipsterTypeOptions";
import selectSportsListFromDB from "../../../utils/selectSportsListFromDB";
import selectTournamentsListFromDB from "../../../utils/selectTournamentsListFromDB";
import selectTipstersFromDB from "../../../utils/selectTipstersFromDB";

function EditLoop({attributes, setAttributes, clientId}) {

  const [isLoading, setLoading] = useState(false);
  const [tips, setTips] = useState([]);
  const [ activeBlockContext, setActiveBlockContext ] = useState();
  const innerBlocksProps = useInnerBlocksProps( {}, { template: TEMPLATE } );
  const blockProps = useBlockProps( {
    className: 'bc-blocks-gutenberg operator-loop-block',
  } );

  useEffect(() => {
    setAttributes({id: Date.now().toString()});
    setLoading(true);
    async function fetchTips() {
      const tips = await getTipList(
        attributes.tipster,
        attributes.status,
        attributes.sortBy,
        attributes.sport,
        attributes.tournament,
        attributes.limit,
        attributes.tipsterType ? attributes.tipsterType : ''
        );
      if (Array.isArray(tips)) {
        setTips(tips);
      }
      setLoading(false);
    }
    fetchTips().catch(e => console.error(e));
  },[
    attributes.tipster,
    attributes.status,
    attributes.sortBy,
    attributes.limit,
    attributes.tipsterType,
    attributes.sport,
    attributes.tournament
  ]);

  const blockContexts = useMemo(
    () =>
      tips?.map( ( tip, index ) => ( {
        tip: tip.tip,
        loopIndex: index + 1,
        event: tip.event,
        tipster: tip.tipster
      } ) ),
    [ tips ]
  );

  const { blocks } = useSelect( select => {
    const { getBlocks } = select( blockEditorStore );
    return {
      blocks: getBlocks(clientId)
    }
  }, [attributes]);

  const html = <div {...blockProps} key="tip-list-loop-block">
    { blockContexts && blockContexts.map( (blockContext, index) => (
      <BlockContextProvider key={ `tip-loop-item-${index}` } value={ blockContext }>
        { blockContext ===
        ( activeBlockContext || blockContexts[ 0 ] ) ? (
          <div {...innerBlocksProps} />
        ) : (
          <div className={attributes.itemClass}>
            <BlockPreview
              blocks={ blocks }
              __experimentalLive
              __experimentalOnClick={ () =>
                setActiveBlockContext( blockContext )
              }
            />
          </div>
        ) }
      </BlockContextProvider>
    ))}
    { attributes.showLoadMore && tips.length >= attributes.limit ? <button className={attributes.showMoreClasses}>Load More</button> : null }
  </div>;

  const content = isLoading ? <Spinner /> : (tips.length > 0 ? html : <p {...blockProps}>No Tips found</p>);

  return (
    <>
      <InspectorControls>
        <PanelBody initialOpen={ true } title="General">
          <SelectControl
            value={attributes.tipster}
            label="Select Tipster"
            options={selectTipstersFromDB()}
            onChange={(tipster) => setAttributes({tipster})}
          />
          <SelectControl
            value={attributes.status}
            label="Status"
            options={getStatusOptions()}
            onChange={(status) => setAttributes({status})}
          />
          <SelectControl
            value={attributes.sortBy}
            onChange={(sortBy) => setAttributes({sortBy})}
            label="Sort By"
            options={getListSortByOptions()}
          />
          <TextControl
            label="Limit"
            type="number"
            value={attributes.limit}
            onChange={(limit) => setAttributes({limit: parseInt(limit)})}
          />
          <SelectControl
            value={attributes.tipsterType}
            onChange={(tipsterType) => setAttributes({tipsterType})}
            label="Tipster Type"
            options={getTipsterTypeOptions()}
          />
          <ToggleControl
            label="Show load more button"
            checked={attributes.showLoadMore}
            onChange={(showLoadMore) => setAttributes({showLoadMore})}
          />
          { attributes.showLoadMore &&
            <TextControl
              label="Show more button additional CSS class(es)"
              help="Separate multiple classes with spaces"
              value={ attributes.showMoreClasses }
              onChange={ (showMoreClasses) => setAttributes({showMoreClasses})}
            />
          }
          <SelectControl
            value={attributes.sport}
            onChange={(sport) => setAttributes({sport})}
            label="Sport Filter"
            options={selectSportsListFromDB()}
          />
          <SelectControl
            value={attributes.tournament}
            onChange={(tournament) => setAttributes({tournament})}
            label="Tournament Filter"
            options={selectTournamentsListFromDB()}
          />
        </PanelBody>
      </InspectorControls>
      <InspectorAdvancedControls>
        <TextControl
          value={ attributes.itemClass }
          label="Loop item additional CSS class(es)"
          help="Separate multiple classes with spaces."
          onChange={(itemClass) => setAttributes({itemClass})}
        />
      </InspectorAdvancedControls>
      { content }
    </>
  );
}

export default EditLoop;
