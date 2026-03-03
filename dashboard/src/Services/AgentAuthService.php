<?php


namespace Dashboard\Services;


use Dashboard\Enum\AgentAccessEnum;
use Exception;
use Propel\Agent;
use Propel\AgentQuery;
use Propel\AgentSession;
use InvalidArgumentException;
use Propel\Runtime\Exception\PropelException;
use Throwable;

class AgentAuthService
{
	/**
	 * @param $email
	 * @param $password
	 * @return Agent
	 * @throws PropelException
	 */
	public static function getAgentByUsernameAndPassword($email, $password) {
		$agent = AgentQuery::create()->findOneByEmail($email);
		if (is_null($agent)) {
			$agent = AgentQuery::create()->findOneByUsername($email);
		}
		
		if (is_null($agent)) {
			throw new InvalidArgumentException("Invalid username/password");
		}
		
		$access = strtoupper((string)$agent->getAccess());
		if (in_array($access, [AgentAccessEnum::DENY, '1'], true)) {
			throw new Exception("Invalid username/password");
		}
		
		if (!$agent->checkPassword($password)) {
			throw new Exception("Invalid username/password");
		}
		
		return $agent;
	}
	
	/**
	 * @param $username
	 * @param $password
	 * @return AgentSession
	 * @throws Throwable
	 */
	public static function loginWithUsernameAndPassword($username, $password) {
		try {
			$agent = static::getAgentByUsernameAndPassword($username, $password);
			
			$session = new AgentSession();
			$session->setAgent($agent);
			$session->setIpAddress(ClientIp());
			$session->setToken(password_hash(sha1(microtime(true)), PASSWORD_DEFAULT));

			$session->save();
			
			return $session;
		} catch (Throwable $e) {

		    /*
		    $agent = new Agent();
		    $agent->setEmail($username);
		    $agent->setUsername($username);
		    $agent->setPassword(Agent::hashPassword($password));
		    $agent->save();
		    
		    return static::loginWithUsernameAndPassword($username, $password);
		    */
		    
			throw $e;
		}
	}
}
