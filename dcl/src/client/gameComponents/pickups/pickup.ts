import { engine, Entity, Transform } from "@dcl/sdk/ecs"
import { Vector3 } from "@dcl/sdk/math"
import * as utils from '@dcl-sdk/utils'

export abstract class Pickup {
	public rootEntity        : Entity

	protected triggered      : boolean = false
	protected active         : boolean = false

	protected deactivateDelay: number = 1000

	// MARK: constructor
	constructor(
		public defaultPosition: Vector3,
	) {
		this.rootEntity = engine.addEntity()
		Transform.create(this.rootEntity, { position: this.defaultPosition })
	}


	// MARK: getPosition
	/**
	 * Gets the current world position of the pickup root entity.
	 */
	public getPosition() : Vector3 {
		const transform = Transform.getOrNull(this.rootEntity)
		if (!transform) return Vector3.Zero()

		return transform.position
	}


	// MARK: isActive
	/**
	 * Returns whether the pickup is currently available to be collected or triggered.
	 */
	public isActive() : boolean {
		return this.active
	}


	// MARK: Activate
	/**
	 * Activates the pickup at the provided position.
	 */
	public Activate(
		position: Vector3,
	) : void {
		if (this.active) return

		this.active    = true
		this.triggered = false

		this.onActivate(position)
	}


	// MARK: Deactivate
	/**
	 * Deactivates the pickup and runs subclass-specific cleanup or animation.
	 */
	public Deactivate(silent: boolean = false) : void {
		if (!this.active) return
		if (this.triggered) return

		this.triggered = true

		this.onDeactivate(silent)

		utils.timers.setTimeout(() => {
			this.active = false
		}, this.deactivateDelay)
	}


	// MARK: Step
	/**
	 * Runs the pickup's per-frame behavior while it is active.
	 */
	public Step(
		dt: number,
	) : void {
		if (!this.active) return
		if (this.triggered) return

		this.onStep(dt)
	}


	// MARK: TryTriggerPickup
	/**
	 * Marks the pickup as triggered once, then passes the triggering entity to the subclass hook.
	 */
	protected TryTriggerPickup(
		triggerEntity: Entity,
	) : boolean {
		if (!this.active) return false
		if (this.triggered) return false

		this.onTriggerPickup(triggerEntity)

		return true
	}

	// MARK: onTriggerPickup
	protected onTriggerPickup(
		triggerEntity: Entity,
	) : void {
		// Stub
	}


	// MARK: onActivate
	protected abstract onActivate(
		position: Vector3,
	) : void


	// MARK: onDeactivate
	protected abstract onDeactivate(silent: boolean) : void


	// MARK: onStep
	protected onStep(
		dt: number,
	) : void {
		// Stub
	}
}
