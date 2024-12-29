curl -X POST "https://api-nps.np.work/wms_test/ws/depositorExchane.1cws" \
-H "Content-Type: text/xml;charset=UTF-8" \
-H "Authorization: Basic d2ViOndlYg==\r\n" \
-H "SOAPAction: \"http://npl-dev.omnic.solutions/wms#OM_depositorExchane:CreateUpdateGoods\"" \
--data @soap/createGoodsBody.xml


curl -X POST "https://api-nps.np.work/wms_test/ws/depositorExchane.1cws" \
-H "Content-Type: text/xml;charset=UTF-8" \
-H "Authorization: Basic d2ViOndlYg==\r\n" \
-H "SOAPAction: \"http://npl-dev.omnic.solutions/wms#OM_depositorExchane:CreateUpdateOrders\"" \
--data @soap/createUpdateOrdersBody.xml

curl -X POST "https://api-nps.np.work/wms_test/ws/depositorExchane.1cws" \
-H "Content-Type: text/xml;charset=UTF-8" \
-H "Authorization: Basic d2ViOndlYg==\r\n" \
-H "SOAPAction: \"http://npl-dev.omnic.solutions/wms#OM_depositorExchane:CreateUpdateOrders\"" \
--data @soap/sample.xml


curl -X POST "https://api-nps.np.work/wms_test/ws/depositorExchane.1cws" \
-H "Content-Type: text/xml;charset=UTF-8" \
-H "Authorization: Basic d2ViOndlYg==\r\n" \
-H "SOAPAction: \"http://npl-dev.omnic.solutions/wms#OM_depositorExchane:GetCurrentRemains\"" \
--data @soap/getStock.xml