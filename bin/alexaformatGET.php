<?php
/**
 * Makes a request to ATS for the top 10 sites in a country
 */
class TopSites {

    protected static $ActionName        = 'TopSites';
    protected static $ResponseGroupName = 'Country';
    protected static $ServiceHost      = 'ats.amazonaws.com';
    protected static $NumReturn         = 2;
    protected static $StartNum          = 10;
    protected static $SigVersion        = '2';
    protected static $HashAlgorithm     = 'HmacSHA256';   

    public function TopSites($accessKeyId, $secretAccessKey, $countryCode) {
        $this->accessKeyId = $accessKeyId;
        $this->secretAccessKey = $secretAccessKey;
        $this->countryCode = $countryCode;
    }

    /**
     * Get top sites from ATS
     */ 
    public function getTopSites() {
        $queryParams = $this->buildQueryParams();
        $sig = $this->generateSignature($queryParams);
        $url = 'http://' . self::$ServiceHost . '/?' . $queryParams . 
          '&Signature=' . $sig;
        print $url;
    }

    /**
     * Builds an ISO 8601 timestamp for request
     */
    protected static function getTimestamp() {
        return gmdate("Y-m-d\TH:i:s.\\0\\0\\0\\Z", time());
    }

    /**
     * Builds the url for the request to ATS
     * The url will be urlencoded as per RFC 3986 and the uri params
     * will be in alphabetical order
     */
    protected function buildQueryParams() {
        $params = array(
            'Action'            => self::$ActionName,
            'ResponseGroup'     => self::$ResponseGroupName,
            'AWSAccessKeyId'    => $this->accessKeyId,
            'Timestamp'         => self::getTimestamp(),
            'CountryCode'       => $this->countryCode,
            'Count'             => self::$NumReturn,
            'Start'             => self::$StartNum,
            'SignatureVersion'  => self::$SigVersion,
            'SignatureMethod'   => self::$HashAlgorithm
        );
        ksort($params);
        $keyvalue = array();
        foreach($params as $k => $v) {
            $keyvalue[] = $k . '=' . rawurlencode($v);
        }
        return implode('&',$keyvalue);
    }

    /**
     * Generates a signature per RFC 2104
     *
     * @param String $queryParams query parameters to use in creating signature
     * @return String             signature
     */
    protected function generateSignature($queryParams) {
        $sign = "GET\n" . strtolower(self::$ServiceHost) . "\n/\n". $queryParams;
        // echo "String to sign: \n" . $sign . "\n\n";
        $sig = base64_encode(hash_hmac('sha256', $sign, $this->secretAccessKey, true));
        return rawurlencode($sig);
    }

}

if (count($argv) < 3) {
    echo "Usage: $argv[0] ACCESS_KEY_ID SECRET_ACCESS_KEY [COUNTRY_CODE]\n";
    exit(-1);
}
else {
    $accessKeyId = $argv[1];
    $secretAccessKey = $argv[2];
    $countryCode = count($argv) > 3 ? $argv[3] : "";
}

$topSites = new TopSites($accessKeyId, $secretAccessKey, $countryCode);
$topSites->getTopSites();
?>
