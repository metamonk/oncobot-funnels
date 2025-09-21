./app/api/gohighlevel/v2/route.ts:292:92
Type error: Property 'length' does not exist on type '{}'.
  290 |           const hasSubstantialUpdate = updateData.firstName !== 'Patient' ||
  291 |                                        updateData.phone ||
> 292 |                                        (updateData.customFields && updateData.customFields.length > 0);
      |                                                                                            ^
  293 |
  294 |           if (hasSubstantialUpdate) {
  295 |             logger.debug(`Updating contact with firstName: ${updateData.firstName}, lastName: ${updateData.lastName}, phone: ${updateData.phone}`);
Next.js build worker exited with code: 1 and signal: null