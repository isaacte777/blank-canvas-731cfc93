<?php

namespace Kappascore\Controller\Api;

class GetLiveResultsRequest extends AbstractExternalRequest {

    public function run($body){

        $filters = [];

        if(!empty($body['sport_id'])){
            $filters['sport_id'] = $body['sport_id'];
        }

        $response = $this->requestOperation('live_results', $filters);

        if(!$response['status']){
            throw new \Exception($response['message']);
        }

        $this->sendResponse(0, $response['message']);

    }

}
