import mysql.connector
from contextlib import contextmanager

class DatabaseManager:
    def __init__(self, host='localhost', user='root', password='1234', database='cleanroom'):
        self.config = {
            'host': host,
            'user': user,
            'password': password,
            'database': database
        }
    
    def get_connection(self):
        """MySQL 연결을 생성하고 반환"""
        try:
            connection = mysql.connector.connect(**self.config)
            return connection
        except mysql.connector.Error as err:
            print(f"MySQL 연결 오류: {err}")
            return None
    
    @contextmanager
    def get_cursor(self):
        """컨텍스트 매니저를 사용한 커서 관리"""
        connection = None
        cursor = None
        try:
            connection = self.get_connection()
            if not connection:
                raise Exception("데이터베이스 연결 실패")
            
            cursor = connection.cursor(dictionary=True)
            yield cursor, connection
            
        except Exception as e:
            if connection:
                connection.rollback()
            raise e
        finally:
            if cursor:
                cursor.close()
            if connection and connection.is_connected():
                connection.close()

# 전역 데이터베이스 매니저 인스턴스
db_manager = DatabaseManager()
