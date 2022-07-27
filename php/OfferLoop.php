<?php

namespace BetterCollective\WpPlugins\Offers\Controllers\OffersLoop;

use BetterCollective\WpPlugins\Offers\Config\Config;
use BetterCollective\WpPlugins\Offers\Controllers\Data\OffersDataController;
use BetterCollective\WpPlugins\Offers\Controllers\ShortcodeController;
use BetterCollective\WpPlugins\Offers\Exceptions\InvalidSortKeyException;
use BetterCollective\WpPlugins\Offers\Controllers\SchemaMarkupController;
use BetterCollective\WpPlugins\Offers\Services\PostMetaService;
use BetterCollective\WpPlugins\Offers\Traits\SingletonTrait;
use BetterCollective\WpPlugins\Offers\ValueObject\OfferFilterTypes\SortBy;
use BetterCollective\WpPlugins\Offers\ValueObject\OffersFilter;
use BetterCollective\WpPlugins\Offers\Controllers\SettingsController;
use BetterCollective\WpPlugins\Offers\ValueObject\OffersOrder;
use WP_Block;

/**
 * Class OffersLoop
 */
class OffersLoop implements RenderInterface
{
    use SingletonTrait;

    /**
     * OffersLoop constructor.
     */
    private function __construct()
    {
    }

    /**
     * @param array $attributes
     * @param boolean $skipCache
     * @param boolean $skipAdmin
     * @return array
     * @throws InvalidSortKeyException
     */
    private function getOffersAndFilters($attributes, $skipCache, $skipAdmin)
    {
        global $post;

        $filter = ShortcodeController::prepareFilters($attributes, $post->ID);

        $customOrders = !empty($attributes['customOrder'])
            ? new OffersOrder(explode(',', $attributes['customOrder']))
            : new OffersOrder([]);
        $deletedOffers = explode(',', $attributes['deletedOffers']);

        $dataController = OffersDataController::getInstance();
        $offers = $dataController->getOffers($filter, $skipCache, $skipAdmin, $customOrders, $deletedOffers);

        return [
            'offers' => $offers,
            'filter' => $filter
        ];
    }

    /**
     * @param array $attributes
     * @param string $content
     * @param WP_Block $block
     * @param string|null $marketId
     *
     * @return mixed
     * @throws InvalidSortKeyException
     */
    public function render($attributes, $content, $block, $marketId = null)
    {
        /**
         * @hook bc_offers_loop_render
         */
        do_action('bc_offers_loop_render', $attributes, $block);
        $itemClasses = !empty($attributes['itemClasses']) ? 'offer ' . esc_attr($attributes['itemClasses']) : 'offer';
        $classes = !empty($attributes['className']) ? esc_attr($attributes['className']) : '';
        $settings = SettingsController::getInstance()->readSettings();

        if ($marketId == null) {
            $marketId = $settings->targetMarket();
        } else {
            $attributes['countryId'] = $marketId;
        }

        $offersAndFilter = $this->getOffersAndFilters($attributes, false, false);

        $offers = !empty($offersAndFilter['offers'][$marketId])
            ? $offersAndFilter['offers'][$marketId]
            : $offersAndFilter['offers'];

        $content = '';
        foreach ($offers as $index => $offer) {
            if (!empty($offer)) {
                $block_content = (
                    new WP_Block(
                        $block->parsed_block,
                        [
                            'offer' => $offer,
                            'loopIndex' => $index, + 1
                            'filter' => $offersAndFilter['filter']
                        ]
                    )
                    )->render(['dynamic' => false]);
                $content .= sprintf(
                    '<div class="%s">%s</div>%s',
                    $itemClasses,
                    $block_content,
                    !empty($attributes['useSchema']) ? SchemaMarkupController::getInstance()->get($offer) : ''
                );
            }
        }//end foreach

        $htmlCache = OffersDataController::getInstance()->getHtmlCacheFile(
            $offersAndFilter['filter'],
            '{market}',
            Config::BC_OFFERS_LOOP_BLOCK,
            $attributes['id'],
            true
        );

        return sprintf(
            '<div data-offersfilter="%s" data-block-id="%s" data-show="%s" data-html-cache="%s"' .
            ' data-loop-block="true" class="bc-offers-gutenberg offers-loop-block %s">%s</div>',
            $offersAndFilter['filter']->getHash(),
            Config::BC_OFFERS_LOOP_BLOCK,
            $attributes['id'],
            $htmlCache,
            $classes,
            $content
        );
    }
}
