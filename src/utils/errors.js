const COMMON_DIMENSIONS = [
  'achievementId', 'adFormat', 'adSourceName', 'adUnitName', 'appVersion',
  'audienceName', 'brandingInterest', 'browser', 'campaignId', 'campaignName',
  'city', 'cityId', 'contentGroup', 'contentType', 'country', 'countryId',
  'date', 'dateHour', 'dateHourMinute', 'day', 'dayOfWeek', 'deviceCategory',
  'deviceModel', 'eventName', 'fileExtension', 'fileName', 'firstSessionDate',
  'fullPageUrl', 'groupId', 'hostName', 'hour', 'isConversionEvent',
  'itemBrand', 'itemCategory', 'itemId', 'itemName', 'landingPage',
  'language', 'linkClasses', 'linkDomain', 'linkId', 'linkText', 'linkUrl',
  'medium', 'minute', 'month', 'newVsReturning', 'operatingSystem',
  'operatingSystemVersion', 'orderCoupon', 'outbound', 'pagePath',
  'pagePathPlusQueryString', 'pageReferrer', 'pageTitle', 'platform',
  'region', 'screenResolution', 'searchTerm', 'sessionCampaignId',
  'sessionCampaignName', 'sessionDefaultChannelGroup', 'sessionGoogleAdsAdGroupName',
  'sessionGoogleAdsAdNetworkType', 'sessionGoogleAdsCampaignName',
  'sessionGoogleAdsKeyword', 'sessionGoogleAdsQuery',
  'sessionMedium', 'sessionSource', 'sessionSourceMedium', 'sessionSourcePlatform',
  'source', 'sourceMedium', 'sourcePlatform', 'streamId', 'streamName',
  'unifiedScreenName', 'userAgeBracket', 'userGender', 'week', 'year',
];

const COMMON_METRICS = [
  'active1DayUsers', 'active28DayUsers', 'active7DayUsers', 'activeUsers',
  'addToCarts', 'advertiserAdClicks', 'advertiserAdCost',
  'advertiserAdCostPerConversion', 'advertiserAdImpressions',
  'averagePurchaseRevenue', 'averageRevenuePerUser',
  'averageSessionDuration', 'bounceRate', 'cartToViewRate', 'checkouts',
  'conversions', 'crashAffectedUsers', 'crashFreeUsersRate',
  'dauPerMau', 'dauPerWau', 'ecommercePurchases', 'engagedSessions',
  'engagementRate', 'eventCount', 'eventCountPerUser', 'eventValue',
  'eventsPerSession', 'firstTimePurchasers', 'grossPurchaseRevenue',
  'itemListClickThroughRate', 'itemListClicks', 'itemListViews',
  'itemPromotionClickThroughRate', 'itemRevenue', 'itemViews',
  'newUsers', 'organicGoogleSearchClicks', 'organicGoogleSearchImpressions',
  'promotionClicks', 'promotionViews', 'purchaseRevenue', 'purchaseToViewRate',
  'purchaserRate', 'returnOnAdSpend', 'screenPageViews', 'screenPageViewsPerSession',
  'scrolledUsers', 'sessionConversionRate', 'sessions',
  'sessionsPerUser', 'totalAdRevenue', 'totalPurchasers', 'totalRevenue',
  'totalUsers', 'transactions', 'transactionsPerPurchaser',
  'userConversionRate', 'userEngagementDuration', 'wauPerMau',
];

/** @param {string} a @param {string} b @returns {number} */
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

/**
 * Try to suggest a correct field name from an error message.
 * @param {string} msg
 * @returns {string|null}
 */
function suggestFieldCorrection(msg) {
  const match = msg.match(/(?:field|dimension|metric)\s+name\s+["']?(\w+)["']?/i)
    || msg.match(/(?:not found|unknown|unrecognized).*?["'](\w+)["']/i);
  if (!match) return null;

  const unknown = match[1];
  const all = [...COMMON_DIMENSIONS, ...COMMON_METRICS];
  let best = null, bestDist = Infinity;
  for (const candidate of all) {
    const d = levenshtein(unknown.toLowerCase(), candidate.toLowerCase());
    if (d < bestDist) { bestDist = d; best = candidate; }
  }
  if (best && bestDist <= 3) return best;
  return null;
}

/**
 * Wrap a command handler with standard error handling
 * @param {Function} fn
 * @returns {Function}
 */
export function withErrorHandler(fn) {
  return async (...args) => {
    try {
      await fn(...args);
    } catch (err) {
      const opts = args.find(a => a?.parent) || args.at(-1);
      const verbose = opts?.parent?.opts?.()?.verbose || opts?.opts?.()?.verbose;

      if (err.code === 16 || err.message?.includes('Not authenticated')) {
        console.error('Not authenticated. Run: analytics-cli login');
      } else if (err.code === 8 || err.message?.includes('quota')) {
        const retryAfter = err.metadata?.get('retry-after')?.[0];
        console.error(`API quota exceeded.${retryAfter ? ` Retry after ${retryAfter}s.` : ''}`);
      } else if (err.code === 5 || err.code === 3) {
        const detail = err.details || err.message;
        const suggestion = suggestFieldCorrection(detail);
        console.error(`Error: ${detail}`);
        if (suggestion) console.error(`Did you mean: ${suggestion}?`);
      } else {
        console.error(`Error: ${err.message}`);
      }

      if (verbose) {
        console.error('\nStack trace:');
        console.error(err.stack);
      }

      process.exitCode = 1;
    }
  };
}
