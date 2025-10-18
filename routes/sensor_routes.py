from flask import Blueprint, jsonify, request
from db import db_manager

# Blueprint 생성
sensor_bp = Blueprint('sensor', __name__, url_prefix='/api')

@sensor_bp.route('/latest')
def get_latest_data():
    """최신 1개 센서 데이터 반환"""
    try:
        with db_manager.get_cursor() as (cursor, connection):
            query = """
            SELECT id, timestamp, co2_ppm, temperature, humidity, 
                   pm1_0, pm2_5, pm10
            FROM sensor_data 
            ORDER BY timestamp DESC 
            LIMIT 1
            """
            cursor.execute(query)
            result = cursor.fetchone()
            
            if result:
                # datetime 객체를 문자열로 변환
                result['timestamp'] = result['timestamp'].strftime('%Y-%m-%d %H:%M:%S')
                return jsonify(result)
            else:
                return jsonify({'error': '데이터가 없습니다'}), 404
                
    except Exception as e:
        return jsonify({'error': f'데이터베이스 오류: {str(e)}'}), 500

@sensor_bp.route('/recent')
def get_recent_data():
    """최근 n개 센서 데이터 반환"""
    n = request.args.get('n', 50, type=int)
    if n <= 0 or n > 1000:
        n = 50
    
    try:
        with db_manager.get_cursor() as (cursor, connection):
            query = """
            SELECT id, timestamp, co2_ppm, temperature, humidity, 
                   pm1_0, pm2_5, pm10
            FROM sensor_data 
            ORDER BY timestamp DESC 
            LIMIT %s
            """
            cursor.execute(query, (n,))
            results = cursor.fetchall()
            
            # datetime 객체를 문자열로 변환
            for result in results:
                result['timestamp'] = result['timestamp'].strftime('%Y-%m-%d %H:%M:%S')
            
            return jsonify(results)
            
    except Exception as e:
        return jsonify({'error': f'데이터베이스 오류: {str(e)}'}), 500

@sensor_bp.route('/hourly-avg')
def get_hourly_average():
    """1시간 단위 평균값 반환 (co2_ppm, temperature, humidity, pm2_5)"""
    try:
        with db_manager.get_cursor() as (cursor, connection):
            query = """
            SELECT 
                DATE_FORMAT(timestamp, '%Y-%m-%d %H:00:00') as hour,
                AVG(co2_ppm) as avg_co2_ppm,
                AVG(temperature) as avg_temperature,
                AVG(humidity) as avg_humidity,
                AVG(pm2_5) as avg_pm2_5
            FROM sensor_data 
            WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
            GROUP BY DATE_FORMAT(timestamp, '%Y-%m-%d %H:00:00')
            ORDER BY hour ASC
            """
            cursor.execute(query)
            results = cursor.fetchall()
            
            return jsonify(results)
            
    except Exception as e:
        return jsonify({'error': f'데이터베이스 오류: {str(e)}'}), 500
