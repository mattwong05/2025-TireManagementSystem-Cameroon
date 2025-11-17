export interface TokenResponse {
  access_token: string
  token_type: string
}

export interface Vehicle {
  id: number
  license_plate: string
  description?: string | null
}

export interface WheelPosition {
  id: number
  position_index: number
  tire_serial?: string | null
  installed_at?: string | null
}

export interface VehicleDetail extends Vehicle {
  wheel_positions: WheelPosition[]
}

export interface UserProfile {
  id: number
  username: string
}
